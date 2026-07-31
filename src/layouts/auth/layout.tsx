import Head from "next/head";
import { LogoLink } from "src/components/logo";
import { withAuthGuard } from "src/components/with-auth-guard";

type LayoutProps = {
  name: string;
  children: React.ReactNode;
};

export const Layout = withAuthGuard(false, ({ children, name }: LayoutProps) => (
  <>
    <Head>
      <title>{name} | zero</title>
    </Head>
    <main className="flex min-h-screen flex-1">
      <header className="fixed left-0 top-0 z-10 w-full p-4">
        <LogoLink />
      </header>
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-full max-w-[440px] px-6 py-16 sm:py-20">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">{name}</h1>
          {children}
        </div>
      </div>
    </main>
  </>
));
