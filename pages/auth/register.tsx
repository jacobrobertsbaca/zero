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
import { useForm } from 'src/hooks/use-form';
import { SubmitButton } from 'src/components/form/submit-button';

const Page = () => {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const auth = useAuth();
  const Form = useForm({
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
        .oneOf([Yup.ref("password")], "Passwords must match!")
    }),
    onSubmit: async (values) => {
      await auth.signUp(values.email, values.password);
      enqueueSnackbar("Check your inbox for a confirmation email!", { variant: "success" });
      router.push('/auth/login');
    }
  });

  return (
    <Form>
      <Stack spacing={3}>
        <TextField label="Email Address" name="email" type="email" fullWidth />
        <TextField label="Password" name="password" type="password" fullWidth />
        <TextField label="Confirm Password" name="passwordConfirmed" type="password" fullWidth />
      </Stack>
      <SubmitButton fullWidth size="large" sx={{ mt: 3}}>Continue</SubmitButton>
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
    </Form>
  );
};

Page.getLayout = (page: React.ReactNode) => (
  <AuthLayout name="Register">
    {page}
  </AuthLayout>
);

export default Page;
