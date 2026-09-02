import { redirect } from "next/navigation";
import { createUserClient } from "@/utils/supabase/server";
import { LoginForm } from "./form";

export default async function Page({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const supabase = await createUserClient();
  const { data } = await supabase.auth.getClaims();
  const params = await searchParams;
  const next = params.url?.startsWith("/") ? params.url : "/";

  if (data?.claims) {
    redirect(next);
  }

  return <LoginForm />;
}
