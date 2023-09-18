import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import * as Yup from 'yup';
import {
  Button,
  Link,
  Stack,
  Typography
} from '@mui/material';
import { useAuth } from 'src/hooks/use-auth';
import { Layout as AuthLayout } from 'src/layouts/auth/layout';
import { useSnackbar } from 'notistack';
import { useForm } from 'src/hooks/use-form';
import { TextField } from 'src/components/form/text-field';
import { SubmitButton } from 'src/components/form/submit-button';

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
    onSubmit: async (values) => {
      await auth.signIn(values.email, values.password);
      router.push('/budgets');
    }
  });

  return <Form>
    <Stack spacing={3}>
      <TextField label="Email Address" name="email" type="email" fullWidth />
      <TextField label="Password" name="password" type="password" fullWidth />
    </Stack>
    <SubmitButton fullWidth size="large" sx={{ mt: 3}}>Continue</SubmitButton>
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
  </Form>
};

Page.getLayout = (page: React.ReactNode) => (
  <AuthLayout name="Login">
    {page}
  </AuthLayout>
);

export default Page;
