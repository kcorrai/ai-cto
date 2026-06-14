import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AI CTO",
  description: "Terms of Service for AI CTO.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-2 text-3xl font-bold text-[#f0f0f0]">Terms of Service</h1>
      <p className="mb-12 text-sm text-[#606060]">Last updated: June 2026</p>

      <div className="space-y-10 text-[#a0a0a0]">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing or using AI CTO (&ldquo;the Service&rdquo;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">2. Description of Service</h2>
          <p className="leading-relaxed">
            AI CTO is an AI-powered code analysis platform that evaluates GitHub repositories and
            provides technical insights, scores, and recommendations. The Service connects to your
            GitHub account to access repository data you authorize.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">3. Account Responsibilities</h2>
          <p className="leading-relaxed">
            You are responsible for maintaining the security of your account credentials. You must
            not share your account with others or use the Service for any unlawful purpose. You are
            solely responsible for all activity that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">4. GitHub Data Access</h2>
          <p className="leading-relaxed">
            When you connect a GitHub repository, you grant AI CTO permission to read the repository
            contents solely for the purpose of analysis. We do not store your source code beyond
            what is required to generate analysis results. You may revoke access at any time via
            your GitHub account settings.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">5. Subscription and Billing</h2>
          <p className="leading-relaxed">
            Paid plans are billed monthly or annually via Stripe. You may cancel your subscription
            at any time; cancellation takes effect at the end of the current billing period. We
            reserve the right to change pricing with 30 days&apos; notice.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">6. Limitation of Liability</h2>
          <p className="leading-relaxed">
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind. AI-generated
            analysis results are advisory in nature and should not be relied upon as professional
            engineering or legal advice. We are not liable for any damages arising from your use of
            the Service or reliance on analysis output.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">7. Intellectual Property</h2>
          <p className="leading-relaxed">
            You retain full ownership of your source code and repositories. AI CTO retains ownership
            of the Service, its algorithms, and all generated analysis reports. You may export and
            share your own reports freely.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">8. Termination</h2>
          <p className="leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these terms, engage
            in abuse, or use the Service in ways that harm other users or the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">9. Changes to Terms</h2>
          <p className="leading-relaxed">
            We may update these Terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the updated Terms. We will notify users of material changes
            via email.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">10. Contact</h2>
          <p className="leading-relaxed">
            For questions about these Terms, contact us at{" "}
            <a href="mailto:yanlizcakaan@gmail.com" className="text-[#3b82f6] hover:underline">
              yanlizcakaan@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
