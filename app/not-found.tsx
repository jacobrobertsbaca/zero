import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoLink } from "src/components/logo";
import { Button } from "src/components/ui/button";

export const metadata = {
  title: "404",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1">
      <header className="fixed left-0 top-0 z-10 w-full px-5 pt-3 pb-5">
        <LogoLink className="text-black" />
      </header>
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-full max-w-[440px] px-6 py-16 text-center sm:py-20">
          <h1 className="mb-3 text-4xl font-semibold tracking-tight">404</h1>
          <p className="text-sm text-muted-foreground">We couldn't seem to find that page... Try going back.</p>
          <Button asChild variant="outline" size="sm" className="mt-6">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Go back
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
