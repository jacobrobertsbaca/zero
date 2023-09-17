import Head from 'next/head';
import { CacheProvider } from '@emotion/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CircularProgress, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { AuthConsumer, AuthProvider } from 'src/contexts/auth-context';
import { useNProgress } from 'src/hooks/use-nprogress';
import { createTheme } from 'src/theme';
import { createEmotionCache } from 'src/utils/create-emotion-cache';
import { ApiProvider } from "src/contexts/api-context";
import 'simplebar-react/dist/simplebar.min.css';
import { SnackbarProvider } from 'notistack';
import { Grid } from "@mui/material";

const clientSideEmotionCache = createEmotionCache();

const SplashScreen = () => <Grid
  container
  spacing={0}
  direction="column"
  alignItems="center"
  justifyContent="center"
  sx={{ minHeight: '100vh' }}
>
  <Grid item xs={3}>
    <CircularProgress color="primary" size={30} />
  </Grid>
</Grid>;

const App = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  useNProgress();

  const getLayout = Component.getLayout ?? ((page) => page);

  const theme = createTheme();

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>
          zero
        </title>
        <meta
          name="viewport"
          content="initial-scale=1, width=device-width"
        />
      </Head>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <ApiProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <SnackbarProvider>
                <AuthConsumer>
                  {
                    (auth) => auth.loading
                      ? <SplashScreen />
                      : getLayout(<Component {...pageProps} />)
                  }
                </AuthConsumer>
              </SnackbarProvider>
            </ThemeProvider>
          </ApiProvider>
        </AuthProvider>
      </LocalizationProvider>
    </CacheProvider>
  );
};

export default App;
