import * as Yup from "yup";
import { useAuth } from "src/hooks/use-auth";
import { toast } from "sonner";
import { TextField } from "src/components/form/text-field";
import { SubmitButton } from "src/components/form/submit-button";
import { Form } from "src/components/form/form";
import { AuthProviders } from "src/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { Separator } from "src/components/ui/separator";

export const SettingsPassword = () => {
  const auth = useAuth();

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
        toast.success("Updated your password!");
        helpers.resetForm();
      }}
    >
      {(formik) => (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Password</CardTitle>
              <CardDescription>Update password</CardDescription>
            </div>
            <SubmitButton
              size="sm"
              disabled={
                Object.keys(formik.errors).length > 0 || !formik.values.password || !formik.values.passwordConfirmed
              }
            >
              Update
            </SubmitButton>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="flex max-w-sm flex-col gap-3">
              <TextField fullWidth label="Password" name="password" type="password" />
              <TextField fullWidth label="Confirm Password" name="passwordConfirmed" type="password" />
            </div>
          </CardContent>
        </Card>
      )}
    </Form>
  );
};
