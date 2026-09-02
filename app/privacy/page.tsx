import type { SVGProps } from "react";

const Brand = () => <span className="tracking-tight text-foreground font-medium">zero</span>;

const GitHubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
  </svg>
);

const sections = [
  {
    title: "Information we collect",
    body: (
      <>
        <p>
          When you create an account, we collect information such as your email address and authentication details. If
          you sign in with Google, we receive the basic profile information needed to authenticate you.
        </p>
        <p>
          You may also provide budgeting data you create in <Brand />, including budgets, categories, and transactions
          you enter manually.
        </p>
        <p>
          If you subscribe to <Brand /> Plus, our payment processor collects the billing and payment information needed
          to process your subscription. We store related subscription status and customer identifiers, not your full
          card number.
        </p>
        <p>
          If you connect a financial institution, we receive the account and transaction information you authorize Plaid
          to share with us, such as account identifiers, balances, and transaction history, so we can sync those
          transactions into your budgets. We do not receive your bank login credentials.
        </p>
        <p>
          We also collect limited technical data automatically, such as device or browser type, IP address, and usage
          events needed to operate and secure the service.
        </p>
      </>
    ),
  },
  {
    title: "How we use your information",
    body: (
      <>
        <p>
          We use the information we collect to provide and improve <Brand />, authenticate your account, sync financial
          data you choose to connect, process subscriptions, detect and address abuse or technical issues, and
          communicate with you about the service when necessary.
        </p>
        <p>We do not sell your personal information.</p>
      </>
    ),
  },
  {
    title: "How we share information",
    body: (
      <>
        <p>
          We share information only as needed to run <Brand />, including with:
        </p>
        <ul>
          <li>
            <span className="font-medium text-foreground">Supabase</span> for authentication and database hosting
          </li>
          <li>
            <span className="font-medium text-foreground">Plaid</span> for secure bank account connections and
            transaction syncing
          </li>
          <li>
            <span className="font-medium text-foreground">Stripe</span> for subscription billing
          </li>
          <li>
            <span className="font-medium text-foreground">Google</span> for optional sign-in
          </li>
        </ul>
        <p>
          These providers process data on our behalf under their own privacy policies. We may also disclose information,
          if required by law, to protect the rights and safety of our users or the product.
        </p>
      </>
    ),
  },
  {
    title: "Data retention and deletion",
    body: (
      <p>
        We retain your information for as long as your account is active or as needed to provide the service. You may
        delete your account, which permanently and immediately removes all account data associated with <Brand />.
      </p>
    ),
  },
  {
    title: "Security",
    body: (
      <p>
        We use administrative, technical, and organizational safeguards designed to protect your information, including
        encrypted connections and access controls. No method of transmission or storage is completely secure, and we
        cannot guarantee absolute security.
      </p>
    ),
  },
  {
    title: "Children’s privacy",
    body: (
      <p>
        <Brand /> is not directed to children under 13, and we do not knowingly collect personal information from
        children under 13. If you believe a child has provided us information, contact us and we will take appropriate
        steps to delete it.
      </p>
    ),
  },
  {
    title: "Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the date above. Continued use of{" "}
        <Brand /> after changes take effect constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        If you have questions about this Privacy Policy or your data, please reach out to us{" "}
        <a
          href="mailto:jacobrobertsbaca@gmail.com"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          over email
        </a>
        .
      </p>
    ),
  },
];

export default function Page() {
  return (
    <article className="page-enter">
      <header className="mb-12">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          <Brand /> is a personal budgeting app. The full source code is available on{" "}
          <a
            href="https://github.com/jacobrobertsbaca/zero"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-baseline gap-1.5 pl-0.5 font-medium text-primary underline-offset-4 hover:underline"
          >
            <GitHubIcon className="size-3.5 shrink-0" />
            GitHub
          </a>
          . This page explains how we collect, use, and share your information.
        </p>
      </header>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.title} className="scroll-mt-24">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
