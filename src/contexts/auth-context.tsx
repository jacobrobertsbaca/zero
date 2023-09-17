import { Immutable, produce } from "immer";
import { useSnackbar } from "notistack";
import { createContext, useState } from "react";
import { supabase } from "src/utils/supabase";
import useAsyncEffect from "use-async-effect";

enum AuthHandlers {
  Initialize,
  SignIn,
  SignOut
};

type AuthUser = Immutable<{
  name: string
}>;

type AuthState = Immutable<{
  /* Whether or not the auth system is loading. 
   * During loading, default auth may be retrieved. */
  loading: boolean;

  /* The current user. If undefined, the user is not authenticated */
  user?: AuthUser;
}>;

type AuthContextType = AuthState & Immutable<{
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): void;
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

  const onInitialize = async (mounted: () => boolean): Promise<void> => {
    if (initialized || !mounted()) return;
    setInitialized(true);
  };

  const signIn = async (): Promise<void> => {

  };

  const signUp = async (): Promise<void> => {
  };

  const signOut = (): void => {

  };

  useAsyncEffect(onInitialize, []);

  return <AuthContext.Provider
    value={{
      ...state,
      signIn,
      signUp,
      signOut
    }}>
      {children}
  </AuthContext.Provider>
};

export const AuthConsumer = AuthContext.Consumer;