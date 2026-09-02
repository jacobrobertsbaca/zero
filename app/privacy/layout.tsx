import { LogoLink } from "src/components/logo";

export const metadata = {
  title: "Privacy Policy",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overscroll-none bg-background">
      <style>{`html, body { overscroll-behavior: none; }`}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh]"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 0% 0%, hsl(var(--primary) / 0.09), transparent 60%), linear-gradient(to bottom, hsl(var(--accent) / 0.55), transparent)",
        }}
      />
      <header className="fixed left-0 top-0 z-10 w-full bg-background/70 px-5 pt-3 pb-5 backdrop-blur-sm sm:bg-transparent md:backdrop-blur-none">
        <LogoLink className="text-black" />
      </header>
      <div className="relative mx-auto w-full max-w-[40rem] px-6 pb-24 pt-24 sm:pb-32 sm:pt-28">{children}</div>
    </main>
  );
}
