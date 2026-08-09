import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogoLink } from "src/components/logo";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./form";

export const metadata = {
  title: "Login | zero",
};

type LoginPageProps = {
  searchParams: Promise<{ url?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const params = await searchParams;
  const next = params.url?.startsWith("/") ? params.url : "/";

  if (data?.claims) {
    redirect(next);
  }

  return (
    <main className="flex min-h-screen flex-1">
      <header className="fixed left-0 top-0 z-10 w-full p-4">
        <LogoLink />
      </header>
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-full max-w-[440px] px-6 py-16 sm:py-20">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">Login</h1>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
