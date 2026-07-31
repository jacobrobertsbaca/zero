import Head from "next/head";
import NextLink from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "src/components/ui/button";

const Page = () => (
  <>
    <Head>
      <title>404 | zero</title>
    </Head>
    <main className="flex min-h-full flex-1 items-center">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 text-center">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight">404: The page you are looking for isn&apos;t here</h1>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or you came here by mistake. Whichever it is, try using the
          navigation
        </p>
        <Button asChild className="mt-6">
          <NextLink href="/">
            <ArrowLeft className="size-4" />
            Go back
          </NextLink>
        </Button>
      </div>
    </main>
  </>
);

export default Page;
