import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Cowbird Depot",
  description: "Our commitment to protecting your privacy and personal information. Learn how we collect, use, and protect your data."
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-lg text-gray-600">
          Last updated: September 25, 2025
        </p>
      </div>

      {/* Page Content */}
      <div className="prose prose-lg max-w-none">
        <h2>What information do we collect?</h2>
        <p>We collect information from you when you register on our site, place an order or fill out a form.</p>
        <p>When ordering or registering on our site, as appropriate, you may be asked to enter your: name, e-mail address, mailing address, phone number, or credit card information. You may, however, visit our site anonymously.</p>

        <h2>What do we use your information for?</h2>
        <p>Any of the information we collect from you may be used in one of the following ways:</p>
        <ul>
          <li>To personalize your experience (Your information helps us to better respond to your individual needs.)</li>
          <li>To improve our website (We continually strive to improve our website offerings based on the information and feedback we receive from you.)</li>
          <li>To improve customer service (Your information helps us to more effectively respond to your customer service requests and support needs.)</li>
          <li>To process transactions</li>
          <li>To administer a contest, promotion, survey or other site feature</li>
          <li>To send periodic emails</li>
        </ul>
        <p>Your information, whether public or private, will not be sold, exchanged, transferred, or given to any other company for any reason whatsoever, without your consent, other than for the express purpose of delivering the purchased product or service requested.</p>
        <p>The email address you provide for order processing, may be used to send you information and updates pertaining to your order, in addition to receiving occasional company news, updates, related product or service information, etc.</p>
        <p><strong>Note:</strong> If at any time you would like to unsubscribe from receiving future emails, we include detailed unsubscribe instructions at the bottom of each email.</p>

        <h2>How do we protect your information?</h2>
        <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.</p>
        <p>We offer the use of a secure server. All supplied sensitive/credit information is transmitted via Secure Socket Layer (SSL) technology and then encrypted into our Payment gateway providers database only to be accessible by those authorized with special access rights to such systems, and are required to keep the information confidential.</p>
        <p>After a transaction, your private information (credit cards, social security numbers, financials, etc.) will not be stored on our servers.</p>

        <h2>Do we use cookies?</h2>
        <p>Yes. Cookies are small files that a site or its service provider transfers to your computers hard drive through your Web browser (if you allow) that enables the sites or service providers systems to recognize your browser and capture and remember certain information.</p>
        <p>We use cookies to help us remember and process the items in your shopping cart, understand and save your preferences for future visits and compile aggregate data about site traffic and site interaction so that we can offer better site experiences and tools in the future. We may contract with third-party service providers to assist us in better understanding our site visitors. These service providers are not permitted to use the information collected on our behalf except to help us conduct and improve our business.</p>
        <p>If you prefer, you can choose to have your computer warn you each time a cookie is being sent, or you can choose to turn off all cookies via your browser settings. Like most websites, if you turn your cookies off, some of our services may not function properly. However, you can still place orders over the telephone or by contacting customer service.</p>

        <h2>Do we disclose any information to outside parties?</h2>
        <p>We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential. We may also release your information when we believe release is appropriate to comply with the law, enforce our site policies, or protect ours or others rights, property, or safety. However, non-personally identifiable visitor information may be provided to other parties for marketing, advertising, or other uses.</p>

        <h2>California Online Privacy Protection Act Compliance</h2>
        <p>Because we value your privacy we have taken the necessary precautions to be in compliance with the California Online Privacy Protection Act. We therefore will not distribute your personal information to outside parties without your consent.</p>
        <p>As part of the California Online Privacy Protection Act, all users of our site may make any changes to their information at anytime by logging into their account control panel and selecting the 'Account Details' option.</p>

        <h2>Childrens Online Privacy Protection Act Compliance</h2>
        <p>We are in compliance with the requirements of COPPA (Childrens Online Privacy Protection Act), we do not collect any information from anyone under 13 years of age. Our website, products and services are all directed to people who are at least 13 years old or older.</p>

        <h2>Online Privacy Policy Only</h2>
        <p>This online privacy policy applies only to information collected through our website and not to information collected offline.</p>

        <h2>Terms and Conditions</h2>
        <p>Please also visit our Terms and Conditions section establishing the use, disclaimers, and limitations of liability governing the use of our website.</p>

        <h2>Your Consent</h2>
        <p>By using our site, you consent to our privacy policy.</p>

        <h2>Changes to our Privacy Policy</h2>
        <p>If we decide to change our privacy policy, we will update the Privacy Policy modification date above.</p>

        <h2>Contacting Us</h2>
        <p>If there are any questions regarding this privacy policy, you may contact us using the information below.</p>
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
