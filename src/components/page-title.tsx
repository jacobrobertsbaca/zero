import Head from "next/head";

export const PageTitle = ({ title }: { title: string }) => (
  <>
    <Head>
      <title>{title} | zero</title>
    </Head>
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
  </>
);
