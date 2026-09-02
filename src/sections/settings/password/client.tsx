"use client";

import * as Yup from "yup";
import { toast } from "sonner";
import { Form } from "src/components/form/form";
import { SubmitButton } from "src/components/form/submit-button";
import { TextField } from "src/components/form/text-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "src/components/ui/card";
import { Separator } from "src/components/ui/separator";
import { supabase } from "src/utils/supabase/client";

export function SettingsPasswordClient({ className }: { className?: string }) {
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
        const { error } = await supabase.auth.updateUser({ password: values.password });
        if (error) throw new Error(error.message);
        toast.success("Updated your password!");
        helpers.resetForm();
      }}
    >
      {(formik) => (
        <Card className={className}>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Password</CardTitle>
              <CardDescription>Choose a new password for your account</CardDescription>
            </div>
            <SubmitButton
              size="sm"
              variant="outline"
              className="shrink-0"
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
}
