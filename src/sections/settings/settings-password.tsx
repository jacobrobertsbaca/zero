import { useCallback, useState } from "react";
import { Button, Card, CardContent, CardHeader, Divider, Stack } from "@mui/material";
import * as Yup from "yup";
import { useAuth } from "src/hooks/use-auth";
import { useSnackbar } from "notistack";
import { TextField } from "src/components/form/text-field";
import { SubmitButton } from "src/components/form/submit-button";
import { Form } from "src/components/form/form";
import { AuthProviders } from "src/contexts/auth-context";

export const SettingsPassword = () => {
  const auth = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  /* Can only reset password for email provider */
  if (auth.user?.provider !== AuthProviders.Email) return null;

  return (
    <Form
      initialValues={{
        password: "",
        passwordConfirmed: "",
      }}
      validationSchema={Yup.object({
        password: Yup.string().label("Password").max(255).min(8).optional(),
        passwordConfirmed: Yup.string().oneOf([Yup.ref("password")], "Passwords must match!"),
      })}
      onSubmit={async (values, helpers) => {
        await auth.updatePassword(values.password);
        enqueueSnackbar("Updated your password!", { variant: "success" });
        helpers.resetForm();
      }}
    >
      {(formik) => (
        <Card>
          <CardHeader
            subheader="Update password"
            title="Password"
            action={
              <SubmitButton
                disabled={
                  Object.keys(formik.errors).length > 0 || !formik.values.password || !formik.values.passwordConfirmed
                }
              >
                Update
              </SubmitButton>
            }
          />
          <Divider />
          <CardContent>
            <Stack spacing={3} sx={{ maxWidth: 400 }}>
              <TextField fullWidth label="Password" name="password" type="password" />
              <TextField fullWidth label="Confirm Password" name="passwordConfirmed" type="password" />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Form>
  );
};
