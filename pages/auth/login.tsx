import * as Yup from "yup";
import { useAuth } from "src/hooks/use-auth";
import { Layout as AuthLayout } from "src/layouts/auth/layout";
import { TextField } from "src/components/form/text-field";
import { SubmitButton } from "src/components/form/submit-button";
import { Form } from "src/components/form/form";
import { Button } from "src/components/ui/button";
import { Separator } from "src/components/ui/separator";
import Image from "next/image";

const Page = () => {
  const auth = useAuth();

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
        await auth.signIn(values.email, values.password);
      }}
    >
      <div className="flex flex-col gap-3">
        <TextField label="Email Address" name="email" type="email" fullWidth />
        <TextField label="Password" name="password" type="password" fullWidth />
        <SubmitButton className="mt-1 w-full" size="lg">
          Continue
        </SubmitButton>
        <div className="relative flex items-center py-1">
          <Separator className="flex-1" />
          <span className="px-3 text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={auth.signInWithGoogle}>
          <Image alt="Google Logo" width={20} height={20} src="/assets/google-logo.svg" />
          Continue with Google
        </Button>
      </div>
    </Form>
  );
};

Page.getLayout = (page: React.ReactNode) => <AuthLayout name="Login">{page}</AuthLayout>;

export default Page;
