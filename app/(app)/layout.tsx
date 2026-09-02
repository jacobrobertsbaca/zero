import { Navigation } from "./navigation";
import { Providers } from "./providers";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Navigation>{children}</Navigation>
    </Providers>
  );
}
