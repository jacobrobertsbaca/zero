import { Session } from "@supabase/supabase-js";
import { Immutable, produce } from "immer";
import { createContext, useState } from "react";
import { supabase } from "src/utils/supabase";
import useAsyncEffect from "use-async-effect";

export enum AuthProviders {
  Unknown = "unknown",
  Email = "email",
  Google = "google"
};

type AuthUser = Immutable<{
  name: string;
  token: string;

  /** The auth provider for this user */
  provider: AuthProviders;
}>;

type AuthState = Immutable<{
  /**
   * Whether or not the auth system is loading. 
   * During loading, default auth may be retrieved. 
   */
  loading: boolean;

  /**
   * The current user. If undefined, the user is not authenticated 
   */
  user?: AuthUser;
}>;

type AuthContextType = AuthState & Immutable<{
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
}>;

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

type AuthProviderProps = {
  children: React.ReactNode
};

export const AuthProvider = ({ children } : AuthProviderProps) => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [state, setState] = useState<AuthState>({
    loading: true
  });

  const fromSession = (session: Session): void => {
    session.user.app_metadata
    setState(produce(state, draft => {
      draft.loading = false;
      draft.user = {
        name: session.user.email!,
        token: session.access_token,
        provider: (session.user.app_metadata.provider ?? "unknown") as AuthProviders
      };
    }));
  };

  const onInitialize = async (mounted: () => boolean): Promise<void> => {
    if (initialized || !mounted()) return;
    setInitialized(true);

    /* Subscribe to auth events */
    supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === "SIGNED_IN") fromSession(session!);
      else if (evt === "SIGNED_OUT") setState(produce(state, draft => {
        draft.user = undefined;
        draft.loading = false;
      }));
    });

    /* Check if user is already logged in */
    const { data: { session }} = await supabase.auth.getSession();
    if (session) fromSession(session);
    else setState(produce(state, draft => {
      draft.loading = false;
    }));
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    fromSession(data.session);
  };

  const signInWithGoogle = async (): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) throw new Error(error.message);
  }

  const signUp = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setState(produce(state, draft => {
      draft.user = undefined;
    }));
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    if (!state.user) throw new Error("You must be logged in to do this.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  useAsyncEffect(onInitialize, []);

  return <AuthContext.Provider
    value={{
      ...state,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      updatePassword
    }}>
      {children}
  </AuthContext.Provider>
};

export const AuthConsumer = AuthContext.Consumer;