import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  FormHelperText,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from 'src/hooks/use-auth';
import { Layout as AuthLayout } from 'src/layouts/auth/layout';
import { useSnackbar } from 'notistack';
import { useForm } from 'src/hooks/use-form';

const Page = () => {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const auth = useAuth();
  const Form = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .email('Must be a valid email')
        .max(255)
        .required('Email is required'),
      password: Yup
        .string()
        .max(255)
        .required('Password is required')
    }),
    onSubmit: async (values, helpers) => {
      await auth.signIn(values.email, values.password);
      router.push('/budgets');
    }
  });

  return <Form>
    {formik =>
      <>
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
            value={formik.values.email} />
          <TextField
            error={!!(formik.touched.password && formik.errors.password)}
            fullWidth
            helperText={formik.touched.password && formik.errors.password}
            label="Password"
            name="password"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            type="password"
            value={formik.values.password} />
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
        <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mt: 3 }}
        >
          Don&apos;t have an account?
          &nbsp;
          <Link
            component={NextLink}
            href="/auth/register"
            underline="hover"
            variant="subtitle2"
          >
            Register
          </Link>
        </Typography>
      </>
    }
  </Form>
};

Page.getLayout = (page: React.ReactNode) => (
  <AuthLayout name="Login">
    {page}
  </AuthLayout>
);

export default Page;
