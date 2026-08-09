import { LogoLink } from "src/components/logo";

export const metadata = {
  title: "Login",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1">
      <header className="fixed left-0 top-0 z-10 w-full p-5">
        <LogoLink />
      </header>
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-full max-w-[440px] px-6 py-16 sm:py-20">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">Login</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
