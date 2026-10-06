import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Shipping Policy | Cardinal Cooling Systems",
  description:
    "Where we ship, processing times, parcel and freight shipping for stainless steel sanitary fittings, valves and tube.",
  alternates: {
    canonical: "https://cardinalcoolingsystems.com/us/shipping-policy",
  },
}

export default function ShippingPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Shipping Policy
        </h1>
        <p className="text-lg text-gray-600">Last updated: October 6, 2026</p>
      </div>

      {/* Page Content */}
      <div className="prose prose-lg max-w-none">
        <h2>Where We Ship</h2>
        <p>
          We currently ship to commercial and residential addresses in the
          contiguous United States only.
        </p>

        <h2>Processing Time</h2>
        <p>
          Orders are typically processed within 1–2 business days. Transit
          times vary by carrier and destination.
        </p>

        <h2>Parcel Shipping</h2>
        <p>
          Parcel shipping charges are calculated at checkout based on weight,
          destination, and service level. Orders over 120 lbs, and all tube
          orders, ship by freight carrier; see Freight Shipments below.
        </p>

        <h2>Freight Shipments</h2>
        <p>
          Orders over 120 lbs, and all A270 tube orders, ship by freight (LTL)
          carrier. Freight is billed at the carrier&apos;s actual cost; we confirm
          the charge with you before anything ships, and on deposit orders it is
          added to the balance invoice.
        </p>
        <p>
          Freight is allowed (no charge) on freight-class orders of $15,000 or
          more shipping to the contiguous United States, except that orders
          shipping to Florida, New York, New Jersey, Delaware, the New England
          states, Oregon and Washington qualify at $21,500 or more. Allowances
          are based on merchandise value before tax. A270 tube ships in 20 ft
          lengths from Kansas City, MO or Paramount, CA; parcel-size orders
          follow the Parcel Shipping terms above.
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

        <h2>Tracking Your Order</h2>
        <p>
          Signed-in customers can see the status of every order on the{" "}
          <LocalizedClientLink href="/account/orders">Orders</LocalizedClientLink>{" "}
          page of their account. For help with a shipment, contact us below.
        </p>

        <h2>Returns</h2>
        <p>
          Returns and refunds are covered by our{" "}
          <LocalizedClientLink href="/return-policy">Return Policy</LocalizedClientLink>.
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
