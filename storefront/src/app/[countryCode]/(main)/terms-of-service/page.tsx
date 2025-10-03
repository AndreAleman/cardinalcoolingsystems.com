import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Cowbird Depot",
  description: "Terms and conditions for using our website and purchasing our premium stainless steel sanitary fittings."
}

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Terms of Service
        </h1>
        <p className="text-lg text-gray-600">
          Last updated: September 25, 2025
        </p>
      </div>

      {/* Page Content */}
      <div className="prose prose-lg max-w-none">
        <h2>1. Terms</h2>
        <p>By accessing this web site, you are agreeing to be bound by these web site Terms and Conditions of Use, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this web site are protected by applicable copyright and trade mark law.</p>

        <h2>2. Use License</h2>
        <p>Permission is granted to view the material on Cowbird Depot's web site for informational purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
        <ul>
          <li>modify or copy the materials;</li>
          <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
          <li>attempt to decompile or reverse engineer any software contained on Cowbird Depot's web site;</li>
          <li>remove any copyright or other proprietary notations from the materials; or</li>
          <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
        </ul>
        <p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by Cowbird Depot at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.</p>

        <h2>3. Disclaimer</h2>
        <p>The materials on Cowbird Depot's web site are provided "as is". Cowbird Depot makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights. Further, Cowbird Depot does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its Internet web site or otherwise relating to such materials or on any sites linked to this site.</p>

        <h2>4. Limitations</h2>
        <p>In no event shall Cowbird Depot or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption,) arising out of the use or inability to use the materials on Cowbird Depot's Internet site, even if Cowbird Depot or a Cowbird Depot authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.</p>

        <h2>5. Revisions and Errata</h2>
        <p>The materials appearing on Cowbird Depot's web site could include technical, typographical, or photographic errors. Cowbird Depot does not warrant that any of the materials on its web site are accurate, complete, or current. Cowbird Depot may make changes to the materials contained on its web site at any time without notice. Cowbird Depot does not, however, make any commitment to update the materials.</p>

        <h2>6. Links</h2>
        <p>Cowbird Depot has not reviewed all of the sites linked to its Internet web site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Cowbird Depot of the site. Use of any such linked web site is at the user's own risk.</p>

        <h2>7. Site Terms of Use Modifications</h2>
        <p>Cowbird Depot may revise these terms of use for its web site at any time without notice. By using this web site you are agreeing to be bound by the then current version of these Terms and Conditions of Use.</p>

        <h2>8. Governing Law</h2>
        <p>Any claim relating to Cowbird Depot's web site shall be governed by the laws of the State of Florida without regard to its conflict of law provisions.</p>

        <h2>Contact Information</h2>
        <address>
          <strong>Cowbird Depot</strong><br />
          <em>(operated by Colibri Connect LLC)</em><br />
          1120 NW 14th Terrace<br />
          Cape Coral, FL 33993<br />
          USA<br />
          <a href="mailto:info@cowbirddepot.com">info@cowbirddepot.com</a><br />
          <a href="tel:+16309479955">(630) 947-9955</a>
        </address>
      </div>
    </div>
  )
}
