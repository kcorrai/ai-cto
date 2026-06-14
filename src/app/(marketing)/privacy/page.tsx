import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AI CTO",
  description: "Privacy Policy for AI CTO.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="mb-2 text-3xl font-bold text-[#f0f0f0]">Privacy Policy</h1>
      <p className="mb-12 text-sm text-[#606060]">Last updated: June 2026</p>

      <div className="space-y-10 text-[#a0a0a0]">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">1. Information We Collect</h2>
          <p className="leading-relaxed">
            We collect information you provide when creating an account (name, email), data from
            your GitHub OAuth connection (username, repository list, repository contents during
            analysis), and usage data (pages visited, features used, analysis history).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>To provide and operate the analysis Service</li>
            <li>To send transactional emails (analysis complete, weekly digests)</li>
            <li>To improve our AI models and analysis quality</li>
            <li>To process subscription payments via Stripe</li>
            <li>To communicate product updates and security notices</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">3. Source Code Handling</h2>
          <p className="leading-relaxed">
            Repository contents are fetched from GitHub at analysis time and processed in memory. We
            do not permanently store your raw source code. Analysis results (findings, scores,
            summaries) are stored in our database and associated with your account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">4. Third-Party Services</h2>
          <p className="mb-3 leading-relaxed">We use the following third-party services:</p>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <span className="text-[#f0f0f0]">Clerk</span> — authentication and user management
            </li>
            <li>
              <span className="text-[#f0f0f0]">Stripe</span> — payment processing
            </li>
            <li>
              <span className="text-[#f0f0f0]">Anthropic</span> — AI analysis (code and text are
              sent to Claude API; governed by Anthropic&apos;s data policies)
            </li>
            <li>
              <span className="text-[#f0f0f0]">Vercel</span> — hosting and infrastructure
            </li>
            <li>
              <span className="text-[#f0f0f0]">Upstash Redis</span> — caching layer
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">5. Data Retention</h2>
          <p className="leading-relaxed">
            We retain your account data and analysis results for as long as your account is active.
            Upon account deletion, your personal data and analysis history are deleted within 30
            days, except where retention is required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">6. Cookies</h2>
          <p className="leading-relaxed">
            We use essential cookies for authentication (managed by Clerk) and session management.
            We do not use third-party advertising cookies. You can control cookies through your
            browser settings, though disabling essential cookies may prevent login.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">7. Your Rights</h2>
          <p className="leading-relaxed">
            You may request access to, correction of, or deletion of your personal data at any time.
            To exercise these rights, email us at{" "}
            <a href="mailto:yanlizcakaan@gmail.com" className="text-[#3b82f6] hover:underline">
              yanlizcakaan@gmail.com
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">8. Security</h2>
          <p className="leading-relaxed">
            We implement industry-standard security measures including encrypted data storage,
            HTTPS-only transport, and OAuth-based authentication. GitHub tokens are encrypted at
            rest. No system is completely secure; we encourage you to use a strong password and
            enable two-factor authentication on your GitHub account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">9. Changes to This Policy</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy periodically. We will notify you of material changes
            via email. Continued use of the Service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">10. Contact</h2>
          <p className="leading-relaxed">
            For privacy-related questions or data requests, contact{" "}
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
