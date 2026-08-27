"use client";

import * as Yup from "yup";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Form } from "src/components/form/form";
import { TextField } from "src/components/form/text-field";
import { SubmitButton } from "src/components/form/submit-button";
import { Button } from "src/components/ui/button";
import { Separator } from "src/components/ui/separator";
import { wrapAsync } from "src/utils/wrap-errors";
import { supabase } from "@/utils/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("url") ?? "/";

  return (
    <Form
      initialValues={{
        email: "",
        password: "",
      }}
      validationSchema={Yup.object({
        email: Yup.string().email("Must be a valid email").max(255).required("Email is required"),
        password: Yup.string().max(255).required("Password is required"),
      })}
      onSubmit={async (values) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw new Error(error.message);
        router.replace(next);
      }}
    >
      <div className="flex flex-col gap-3">
        <TextField label="Email Address" name="email" type="email" fullWidth />
        <TextField label="Password" name="password" type="password" fullWidth />
        <SubmitButton className="mt-1 w-full">Continue</SubmitButton>
        <div className="relative flex items-center py-1">
          <Separator className="flex-1" />
          <span className="px-3 text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            void wrapAsync(async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/login/callback?next=${encodeURIComponent(next)}`,
                },
              });
              if (error) throw new Error(error.message);
            })
          }
        >
          <Image alt="Google Logo" width={20} height={20} src="/assets/google-logo.svg" />
          Continue with Google
        </Button>
      </div>
    </Form>
  );
}
