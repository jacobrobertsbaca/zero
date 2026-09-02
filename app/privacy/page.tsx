const Brand = () => <span className="tracking-tight text-foreground font-medium">zero</span>;

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
      <header className="mb-14 sm:mb-16">
        <p className="mb-5  text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sep 1, 2026</p>
        <h1 className="mb-5 text-[2.125rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl sm:leading-[1.05]">
          Privacy Policy
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          <Brand /> is a personal budgeting app. This page explains how we collect, use, and share your information.
        </p>
      </header>

      <div className="divide-y divide-border/80">
        {sections.map((section, index) => (
          <section key={section.title} className="scroll-mt-24 py-8 first:pt-0 last:pb-0 sm:py-9">
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[11px] tabular-nums text-primary/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="text-base font-semibold tracking-tight text-foreground">{section.title}</h2>
            </div>
            <div className="space-y-3 pl-8 text-[15px] leading-[1.7] text-muted-foreground sm:pl-9 [&_ul]:mt-1 [&_ul]:space-y-2 [&_ul]:pl-0 [&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-primary/50 [&_li]:before:content-['·']">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
