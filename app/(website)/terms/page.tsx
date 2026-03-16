import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
}

export default function TermsPage() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: March 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using the SA Ventures website
              (saventuresgroup.in), you agree to be bound by these Terms and
              Conditions. If you do not agree to these terms, please do not use
              our website.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              2. Services
            </h2>
            <p>
              SA Ventures provides real estate advisory and property
              consultation services. We act as intermediaries between property
              buyers and developers. We do not own, construct, or guarantee any
              properties listed on our website. All property details, pricing,
              and availability are subject to change and should be verified
              independently.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              3. Property Listings
            </h2>
            <p>
              Property information displayed on our website, including
              specifications, pricing, images, and amenities, is provided by
              respective developers and is for informational purposes only. SA
              Ventures makes no warranties regarding the accuracy, completeness,
              or reliability of such information. Buyers are advised to conduct
              their own due diligence before making purchase decisions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              4. Intellectual Property
            </h2>
            <p>
              All content on this website, including text, images, logos, and
              design elements, is the property of SA Ventures or its licensors
              and is protected by Indian intellectual property laws. You may not
              reproduce, distribute, or use any content without prior written
              permission.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              5. User Submissions
            </h2>
            <p>
              When you submit an inquiry or contact form, you consent to SA
              Ventures contacting you via phone, email, or WhatsApp regarding
              your inquiry and related property information. You may opt out of
              such communications at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              6. Limitation of Liability
            </h2>
            <p>
              SA Ventures shall not be held liable for any direct, indirect,
              incidental, or consequential damages arising from the use of this
              website or reliance on any information provided herein. Our
              liability in all cases shall be limited to the fees paid for our
              advisory services, if any.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              7. RERA Compliance
            </h2>
            <p>
              All properties listed on our website are subject to the provisions
              of the Real Estate (Regulation and Development) Act, 2016 (RERA)
              as applicable in the State of Maharashtra. Buyers are advised to
              verify RERA registration details of any project before proceeding
              with a purchase.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              8. Governing Law
            </h2>
            <p>
              These terms shall be governed by and construed in accordance with
              the laws of India. Any disputes arising from the use of this
              website shall be subject to the exclusive jurisdiction of the
              courts in Navi Mumbai, Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              9. Changes to Terms
            </h2>
            <p>
              SA Ventures reserves the right to modify these Terms and
              Conditions at any time. Changes will be effective immediately upon
              posting on this website. Your continued use of the website
              constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              10. Contact
            </h2>
            <p>
              For questions regarding these Terms and Conditions, please contact
              us at +91 91675 92831 or visit our office in Navi Mumbai.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
