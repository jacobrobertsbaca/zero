import NextLink from "next/link";
import { cn } from "src/utils";

export const Logo = ({ className }: { className?: string }) => (
  <span className={cn("text-lg font-semibold tracking-tight text-primary", className)}>zero</span>
);

export const LogoLink = ({ className }: { className?: string }) => (
  <NextLink href="/" className="inline-flex h-8 items-center no-underline rounded-md">
    <Logo className={className} />
  </NextLink>
);
