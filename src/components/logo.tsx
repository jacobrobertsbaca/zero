import NextLink from "next/link";

export const Logo = ({ className }: { className?: string }) => (
  <span className={className ?? "text-lg font-semibold tracking-tight text-primary"}>zero</span>
);

export const LogoLink = () => (
  <NextLink href="/" className="inline-flex h-8 items-center no-underline">
    <Logo />
  </NextLink>
);
