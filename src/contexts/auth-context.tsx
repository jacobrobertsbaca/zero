import { Session } from "@supabase/supabase-js";
import { Immutable, produce } from "immer";
import { createContext, useEffect, useState } from "react";
import { http } from "src/utils/http";
import { supabase } from "src/utils/supabase";

export enum AuthProviders {
  Unknown = "unknown",
  Email = "email",
  Google = "google",
}

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

  /**
   * The user's token. If undefined, the user is not authenticated.
   */
  token?: string;
}>;

type AuthContextType = AuthState &
  Immutable<{
    signIn(email: string, password: string): Promise<void>;
    signInWithGoogle(): Promise<void>;
    signOut(): Promise<void>;
    updatePassword(newPassword: string): Promise<void>;
    deleteAccount(): Promise<void>;
  }>;

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [state, setState] = useState<AuthState>({
    loading: true,
  });

  const fromSession = (session: Session): void => {
    setState(
      produce(state, (draft) => {
        draft.loading = false;
        draft.user = {
          name: session.user.email!,
          token: session.access_token,
          provider: (session.user.app_metadata.provider ?? "unknown") as AuthProviders,
        };
        draft.token = session.access_token;
      })
    );
  };

  const onInitialize = async (): Promise<void> => {
    if (initialized) return;
    setInitialized(true);

    /* Subscribe to auth events */
    supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === "SIGNED_IN") fromSession(session!);
      else if (evt === "TOKEN_REFRESHED") fromSession(session!);
      else if (evt === "SIGNED_OUT")
        setState(
          produce(state, (draft) => {
            draft.user = undefined;
            draft.loading = false;
            draft.token = undefined;
          })
        );
    });

    /* Check if user is already logged in */
    const {
      data: { session },
    } = await supabase.auth.refreshSession();
    if (session) fromSession(session);
    else
      setState(
        produce(state, (draft) => {
          draft.loading = false;
        })
      );
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    fromSession(data.session);
  };

  const signInWithGoogle = async (): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) throw new Error(error.message);
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setState(
      produce(state, (draft) => {
        draft.user = undefined;
        draft.token = undefined;
      })
    );
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    if (!state.user) throw new Error("You must be logged in to do this.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  const deleteAccount = async (): Promise<void> => {
    await http("/account", "DELETE", { token: state.token });
    await signOut();
  };

  useEffect(
    () => void onInitialize(),
    // This effect is only run once, so no need to include `onInitialize` in the deps
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signInWithGoogle,
        signOut,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthConsumer = AuthContext.Consumer;
