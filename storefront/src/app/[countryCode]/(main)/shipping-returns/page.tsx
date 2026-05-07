import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Returns - Cardinal Cooling Systems",
  description:
    "Information about our shipping policies, delivery times, and return procedures for stainless steel sanitary fittings.",
}

export default function ShippingReturns() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Shipping & Returns
        </h1>
        <p className="text-lg text-gray-600">Last updated: February 14, 2026</p>
      </div>

      {/* Page Content */}
      <div className="prose prose-lg max-w-none">
        <h2>Shipping Policy</h2>
        <p>
          We currently ship to commercial and residential addresses in the
          contiguous United States only. Orders are typically processed within
          1–2 business days. Transit times vary by carrier and destination.
        </p>
        <p>
          Standard shipping charges are calculated at checkout based on weight,
          destination, and service level. For qualifying large orders, free
          freight allowances apply as described in the Free Freight Policy
          section below.
        </p>

        <h2>Returns &amp; Refunds</h2>
        <p>
          Standard products may be returned within 30 days of delivery with
          prior authorization. Items must be unused, in their original packaging,
          and suitable for resale.
        </p>
        <p>
          To request a return, please contact us at{" "}
          <a href="mailto:aleman@cardinalcoolingsystems.com">
            aleman@cardinalcoolingsystems.com
          </a>{" "}
          or{" "}
          <a href="tel:+16309479955">
            (630) 947-9955
          </a>{" "}
          for a Return Merchandise Authorization (RMA) and shipping
          instructions. Once we receive and inspect the returned goods, approved
          refunds will be issued to the original payment method, less any
          applicable restocking or return shipping charges if applicable.
        </p>

        <h2>Free Freight Policy</h2>
        <p>
          Cardinal Cooling Systems currently offers full freight allowance to
          the lower 48 US states on sanitary valve and fitting orders exceeding
          $2,500, excluding clamps and hangers-only orders. A270 Polished Tube
          orders are full freight allowed to Eastern and Central time zones for
          orders exceeding $7,500, and to Mountain and Western time zones for
          orders exceeding $25,000.
        </p>

        <h2>Tube Case Quantities</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tube OD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Qty. (ft.)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  1/2″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  300
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  3/4″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  300
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  1″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  300
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  1-1/2″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  300
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  300
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2-1/2″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  300
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  3″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  200
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  4″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  100
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  6″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  40
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  8″
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  20
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Warranty</h2>
        <p>
          Cardinal Cooling Systems LLC (herein called Cardinal Cooling Systems)
          warrants the products described herein to be
          free from defects in material and workmanship for a period of ninety
          (90) days from date of shipment by Cardinal Cooling Systems under
          normal use and service. Cardinal Cooling Systems&apos;s sole
          obligation under this warranty is limited to replacing, as hereinafter
          provided, any stock (not special order or fabricated) product found to
          Cardinal Cooling Systems&apos;s satisfaction to be defective upon
          examination by Cardinal Cooling Systems, provided that such product
          shall be returned for inspection to Cardinal Cooling Systems within
          thirty (30) days after discovery of the defect.
        </p>

        <p>
          The replacement of defective products will be made without charge for
          parts. This warranty shall not apply to: (a) any product that has been
          subject to abuse, negligence, accident, or misapplication; (b) any
          product altered or repaired by a party not exclusively authorized by
          Cardinal Cooling Systems; and (c) normal maintenance services or the
          replacement of service items (such as gaskets and seats) made in
          connection with such services. To the extent permitted by State and
          Federal law, this limited warranty shall extend only to the buyer and
          any other person reasonably expected to use or consume the warranted
          goods.
        </p>

        <p>
          Cardinal Cooling Systems disclaims any and all liability for injury to
          persons or property, or other damages of any nature, including
          special, indirect, consequential, compensatory, and punitive damages,
          directly or indirectly resulting from the performance, operation, or
          the failure to operate, of any equipment or process. No action may be
          brought against Cardinal Cooling Systems for an alleged breach of
          warranty unless such action is instituted within ninety (90) days from
          the date the cause of action accrues. This limited warranty shall be
          construed and enforced to the fullest extent allowable by applicable
          State and Federal law.
        </p>

        <p>
          <strong>
            OTHER THAN THE OBLIGATION OF CARDINAL COOLING SYSTEMS SET FORTH
            HEREIN, CARDINAL COOLING SYSTEMS DISCLAIMS ALL WARRANTIES, EXPRESS
            OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY IMPLIED WARRANTIES OF
            MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE, AND ANY OTHER
            OBLIGATION OR LIABILITY. THE FOREGOING CONSTITUTES CARDINAL COOLING
            SYSTEMS&apos;S SOLE OBLIGATION WITH RESPECT TO DAMAGES, WHETHER
            DIRECT, INCIDENTAL OR CONSEQUENTIAL, RESULTING FROM THE USE OR
            PERFORMANCE OF THE PRODUCT.
          </strong>
        </p>

        <h2>Contact Information</h2>
        <address>
          <strong>Cardinal Cooling Systems LLC</strong><br />
          333 S.E. 2nd Avenue, Suite 2000<br />
          Miami, FL 33131<br />
          USA

          <br />
          <a href="mailto:aleman@cardinalcoolingsystems.com">
            aleman@cardinalcoolingsystems.com
          </a>
          <br />
          <a href="tel:+16309479955">
            (630) 947-9955
          </a>
        </address>
      </div>
    </div>
  )
}
