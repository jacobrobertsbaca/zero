import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import { useAuth } from "src/hooks/use-auth";

type PropTypes = {
  protect: boolean;
  children: React.ReactNode;
};

export const AuthGuard: React.FC<PropTypes> = ({ protect, children }: PropTypes) => {
  const router = useRouter();
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  // Only do authentication check on component mount.
  // This flow allows you to manually redirect the user after sign-out, otherwise this will be
  // triggered and will automatically redirect to sign-in page.

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!user && protect) {
      console.log("Not authenticated, redirecting");
      router
        .replace({
          pathname: "/auth/login",
          query: router.asPath !== "/" ? { continueUrl: router.asPath } : undefined,
        })
        .catch(console.error);
    } else if (user && !protect) {
      console.log("Already authenticated, redirecting");
      router.replace({ pathname: "/budgets" }).catch(console.error);
    } else {
      setChecked(true);
    }
  }, [router, user, protect]);

  if (!checked) {
    return null;
  }

  // If got here, it means that the redirect did not occur, and that tells us that the user is
  // authenticated / authorized.

  return <>{children}</>;
};
