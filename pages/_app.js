import Head from "next/head";
import { AuthConsumer, AuthProvider } from "src/contexts/auth-context";
import { useNProgress } from "src/hooks/use-nprogress";
import "src/styles/globals.css";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import { SWRConfig } from "swr";
import { Spinner } from "src/components/ui/spinner";
import { TooltipProvider } from "src/components/ui/tooltip";

const SplashScreen = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Spinner className="size-6" />
  </div>
);

const App = (props) => {
  const { Component, pageProps } = props;

  useNProgress();

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <title>zero</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <SnackbarProvider>
            <SWRConfig
              value={{
                onError(err) {
                  if (err) console.error(err);
                  enqueueSnackbar(err?.message ?? "An error occurred", { variant: "error" });
                },

                /** IMO This leads to a lot of extra revalidations for not a lot of benefit... */
                revalidateOnFocus: false,
              }}
            >
              <AuthConsumer>{(auth) => (auth.loading ? <SplashScreen /> : getLayout(<Component {...pageProps} />))}</AuthConsumer>
            </SWRConfig>
          </SnackbarProvider>
        </TooltipProvider>
      </AuthProvider>
    </>
  );
};

export default App;
