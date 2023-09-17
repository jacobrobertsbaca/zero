import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from 'src/hooks/use-auth';
import { Layout as AuthLayout } from 'src/layouts/auth/layout';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

const Page = () => {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const auth = useAuth();
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      passwordConfirmed: ''
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .label("Email")
        .email('Must be a valid email')
        .max(255)
        .required('Email is required'),
      password: Yup
        .string()
        .label("Password")
        .min(8)
        .max(255)
        .required('Password is required'),
      passwordConfirmed: Yup
        .string()
        .oneOf([ Yup.ref("password") ], "Passwords must match!")
    }),
    onSubmit: async (values, helpers) => {
      try {
        await auth.signUp(values.email, values.password);
        enqueueSnackbar("Check your inbox for a confirmation email!", { variant: "success" });
        router.push('/auth/login');
      } catch (err: any) {
        enqueueSnackbar(err.message, { variant: "error" });
        helpers.setStatus({ success: false });
        helpers.setSubmitting(false);
      }
    }
  });

  return (
    <>
      <form
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <Stack spacing={3}>
          <TextField
            error={!!(formik.touched.email && formik.errors.email)}
            fullWidth
            helperText={formik.touched.email && formik.errors.email}
            label="Email Address"
            name="email"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            type="email"
            value={formik.values.email}
          />
          <TextField
            error={!!(formik.touched.password && formik.errors.password)}
            fullWidth
            helperText={formik.touched.password && formik.errors.password}
            label="Password"
            name="password"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            type="password"
            value={formik.values.password}
          />
          <TextField
            error={!!(formik.touched.passwordConfirmed && formik.errors.passwordConfirmed)}
            fullWidth
            helperText={formik.touched.passwordConfirmed && formik.errors.passwordConfirmed}
            label="Confirm Password"
            name="passwordConfirmed"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            type="password"
            value={formik.values.passwordConfirmed}
          />
        </Stack>
        <Button
          fullWidth
          size="large"
          sx={{ mt: 3 }}
          type="submit"
          variant="contained"
        >
          Continue
        </Button>
      </form>
      <Typography
        color="text.secondary"
        variant="body2"
        sx={{ mt: 3 }}
      >
        Already have an account?
        &nbsp;
        <Link
          component={NextLink}
          href="/auth/login"
          underline="hover"
          variant="subtitle2"
        >
          Log in
        </Link>
      </Typography>
    </>
  );
};

Page.getLayout = (page: React.ReactNode) => (
  <AuthLayout name="Register">
    {page}
  </AuthLayout>
);

export default Page;
