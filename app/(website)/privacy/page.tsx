import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: March 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              1. Introduction
            </h2>
            <p>
              SA Ventures (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              respects your privacy and is committed to protecting your personal
              data. This Privacy Policy explains how we collect, use, store, and
              protect information when you use our website (saventuresgroup.in)
              and services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              2. Information We Collect
            </h2>
            <p className="mb-2">
              We collect the following information when you interact with our
              website:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Contact Information:</strong> Name, phone number, and
                email address provided through our contact forms.
              </li>
              <li>
                <strong>Inquiry Details:</strong> Project preferences and
                messages you submit.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, time spent, browser
                type, and device information collected automatically.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                To respond to your property inquiries and provide consultation
              </li>
              <li>
                To share relevant property information and updates via phone,
                email, or WhatsApp
              </li>
              <li>To improve our website and services</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              4. Data Sharing
            </h2>
            <p>
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information with property developers
              only when necessary to process your inquiry for a specific
              project, and only with your implied consent through the inquiry
              submission.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              5. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access, alteration,
              disclosure, or destruction. However, no method of transmission over
              the internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              6. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as necessary to
              fulfill the purposes outlined in this policy, unless a longer
              retention period is required by law. Inquiry data is typically
              retained for up to 24 months.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              7. Your Rights
            </h2>
            <p className="mb-2">
              Under applicable Indian data protection laws, you have the right
              to:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at +91 91675 92831.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              8. Cookies
            </h2>
            <p>
              Our website may use cookies and similar technologies to improve
              user experience and analyze website traffic. You can control cookie
              preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated revision date. We encourage
              you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              10. Contact Us
            </h2>
            <p>
              For any privacy-related questions or concerns, please contact us
              at +91 91675 92831 or visit our office in Navi Mumbai, Maharashtra,
              India.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
