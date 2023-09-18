import { useCallback, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack
} from '@mui/material';
import * as Yup from 'yup';
import { useForm } from 'src/hooks/use-form';
import { useAuth } from 'src/hooks/use-auth';
import { useSnackbar } from 'notistack';
import { TextField } from 'src/components/form/text-field';
import { SubmitButton } from 'src/components/form/submit-button';

export const SettingsPassword = () => {
  const auth = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const Form = useForm({
    initialValues: {
      password: '',
      passwordConfirmed: ''
    },
    validationSchema: Yup.object({
      password: Yup
        .string()
        .label("Password")
        .max(255)
        .min(8)
        .optional(),
      passwordConfirmed: Yup
        .string()
        .oneOf([Yup.ref("password")], "Passwords must match!")
    }),
    async onSubmit(values, helpers) {
      await auth.updatePassword(values.password);
      enqueueSnackbar("Updated your password!", { variant: "success" });
      helpers.resetForm();
    }
  });

  return (
    <Form>
      {formik => (
        <Card>
          <CardHeader
            subheader="Update password"
            title="Password"
            action={
              <SubmitButton disabled={
                Object.keys(formik.errors).length > 0 ||
                !formik.values.password || 
                !formik.values.passwordConfirmed
                }
              >
                Update
              </SubmitButton>
            }
          />
          <Divider />
          <CardContent>
            <Stack
              spacing={3}
              sx={{ maxWidth: 400 }}
            >
              <TextField fullWidth label="Password" name="password" type="password" />
              <TextField fullWidth label="Confirm Password" name="passwordConfirmed" type="password" />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Form>
  );
};
