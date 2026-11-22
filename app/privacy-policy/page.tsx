import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-18 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: June 02, 2026</p>

      <p className="mb-4">
        Welcome to <strong>Gocyn</strong> ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our e‑learning platform, enroll in courses or internships, and receive completion certificates. By using our services, you agree to the practices described in this policy.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">1. Information We Collect</h2>

      <h3 className="text-xl font-medium mt-4 mb-2 text-gray-800">1.1 Personal Identification Information</h3>
      <p className="mb-4">
        When you register an account, we collect your <strong>name</strong> and <strong>email address</strong>. You also create a <strong>password</strong> (hashed and never stored in plain text). This information is necessary to create and secure your account, provide access to courses, and issue certificates.
      </p>

      <h3 className="text-xl font-medium mt-4 mb-2 text-gray-800">1.2 Payment Information</h3>
      <p className="mb-4">
        All payments are processed through our third‑party payment gateway, <strong>Razorpay</strong>. When you purchase a course or internship, Razorpay collects your payment details (such as credit/debit card numbers, UPI IDs, or net banking credentials). <strong>We do not receive or store your full payment instrument details</strong>. We only retain a transaction reference and purchase status to manage your course access. Razorpay’s privacy practices are governed by their own privacy policy.
      </p>

      <h3 className="text-xl font-medium mt-4 mb-2 text-gray-800">1.3 Course & Learning Data</h3>
      <p className="mb-4">
        To deliver our services, we track your course enrollments, progress, completed lessons, quiz scores, and internship milestones. This data enables us to award completion certificates and provide instructor feedback through assigned mentors.
      </p>

      <h3 className="text-xl font-medium mt-4 mb-2 text-gray-800">1.4 Communications</h3>
      <p className="mb-4">
        If you contact us (e.g., support requests, queries), we collect your name, email address, and the content of your message. We may also send you transactional emails (purchase confirmations, certificate issuance) and, with your consent, promotional communications about new courses or features.
      </p>

      <h3 className="text-xl font-medium mt-4 mb-2 text-gray-800">1.5 Automatically Collected Data</h3>
      <p className="mb-4">
        Like most websites, we automatically collect certain information when you visit our platform:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Log Files:</strong> IP address, browser type, Internet Service Provider (ISP), referring/exit pages, date/time stamps, and clickstream data.</li>
        <li><strong>Cookies & Similar Technologies:</strong> Small data files stored on your device that help us improve your experience, analyze usage, and serve relevant advertisements (see Section 6).</li>
        <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">2. How We Use Your Information</h2>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Service Provision:</strong> To create and maintain your account, authenticate logins, enroll you in courses, display your dashboard/portfolio, and generate completion certificates.</li>
        <li><strong>Payment Processing:</strong> To initiate and complete transactions via Razorpay, verify purchase status, and grant access to paid content.</li>
        <li><strong>Communication:</strong> To send essential updates (e.g., course reminders, certificate availability) and, if you consent, promotional offers. You may opt out of marketing emails at any time.</li>
        <li><strong>Personalization:</strong> To remember your preferences and tailor course recommendations based on your learning activity.</li>
        <li><strong>Analytics & Improvement:</strong> To analyze aggregated usage patterns, diagnose technical issues, and enhance the platform’s functionality and user experience.</li>
        <li><strong>Advertising:</strong> To display Google AdSense ads that help support our service. This involves the use of cookies to show interest‑based advertisements (see Section 7).</li>
        <li><strong>Security & Compliance:</strong> To detect and prevent fraud, abuse, or illegal activities, and to comply with legal obligations.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">3. Legal Basis for Processing (GDPR)</h2>
      <p className="mb-4">
        If you are located in the European Economic Area (EEA) or the United Kingdom, our legal bases for processing your personal data are:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Contractual Necessity:</strong> Processing required to fulfill our agreement with you (e.g., account registration, course access, certificate delivery).</li>
        <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate interests, such as improving our platform, securing our services, and conducting analytics, provided those interests do not override your fundamental rights.</li>
        <li><strong>Consent:</strong> Processing based on your explicit consent, for example, for marketing emails or the placement of non‑essential cookies. You may withdraw consent at any time.</li>
        <li><strong>Legal Obligation:</strong> Processing necessary to comply with applicable laws and regulations.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">4. How We Share Your Information</h2>
      <p className="mb-4">
        We do not sell your personal information. We only share data in the following limited circumstances:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>
          <strong>Mentors / Instructors:</strong> When you complete a course or internship, your name and completion status are shared with the assigned mentor solely for the purpose of issuing your certificate. Mentors are contractually obligated to keep this information confidential.
        </li>
        <li>
          <strong>Payment Processor (Razorpay):</strong> To process purchases, we share transaction details with Razorpay. Razorpay acts as a data processor and adheres to PCI‑DSS security standards.
        </li>
        <li>
          <strong>Service Providers:</strong> We may engage trusted third parties to assist with website hosting, analytics (e.g., Google Analytics), email delivery, and advertising (e.g., Google AdSense). These providers are bound by confidentiality agreements and are only permitted to use your data as instructed by us.
        </li>
        <li>
          <strong>Advertising Partners:</strong> Third‑party vendors, including Google, use cookies to serve ads based on your prior visits to our website or other sites. See Section 7 for more details and opt‑out options.
        </li>
        <li>
          <strong>Legal & Safety:</strong> We may disclose information if required by law, court order, or governmental authority, or to protect the rights, property, or safety of our company, our users, or the public.
        </li>
        <li>
          <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction, subject to the same privacy commitments.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">5. Data Retention</h2>
      <p className="mb-4">
        We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Account Information:</strong> Stored until you delete your account or after a prolonged period of inactivity, after which it is securely deleted or anonymized.</li>
        <li><strong>Course & Certificate Data:</strong> Retained indefinitely to allow you to access your learning history and re‑download certificates. You may request deletion of this data, but it will result in the loss of certificate access.</li>
        <li><strong>Payment Records:</strong> Kept for a minimum period required by applicable tax and accounting laws (typically 7–10 years).</li>
        <li><strong>Logs & Analytics:</strong> Automatically collected data is retained in identifiable form for up to 26 months and then aggregated or anonymized.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">6. Cookies and Tracking Technologies</h2>
      <p className="mb-4">
        We use cookies, web beacons, and similar technologies for the following purposes:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Essential Cookies:</strong> Necessary for the operation of our platform (e.g., authentication, session management). These cannot be disabled.</li>
        <li><strong>Functionality Cookies:</strong> Remember your preferences and settings to enhance your experience.</li>
        <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site (e.g., Google Analytics). The information is aggregated and anonymous.</li>
        <li><strong>Advertising Cookies:</strong> Used by Google AdSense and other ad networks to serve personalized ads based on your browsing history and interests (see Section 7).</li>
      </ul>
      <p className="mb-4">
        You can control cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of the platform. For users in the EEA/UK, we implement a cookie consent banner that allows you to accept or reject non‑essential cookies.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">7. Google AdSense & Personalized Advertising</h2>
      <p className="mb-4">
        To fund our platform, we display advertisements through Google AdSense. This is how it impacts your privacy:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>
          Third‑party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.
        </li>
        <li>
          Google’s use of advertising cookies enables it and its instructors to serve ads to you based on your visit to our sites and/or other sites on the Internet.
        </li>
        <li>
          You may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. Alternatively, you can opt out of many third‑party vendors’ use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
        </li>
        <li>
          Our site does not support personalized ads for users we know are under the age of consent; only non‑personalized ads are shown in such cases.
        </li>
      </ul>
      <p className="mb-4">
        For users in the EEA, UK, and regions requiring consent, we obtain your explicit consent before serving personalized ads via our cookie consent mechanism. You can revoke this consent at any time by clearing your browser cookies or using the provided opt‑out links.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">8. Data Security</h2>
      <p className="mb-4">
        We implement appropriate technical and organizational measures to protect your personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. These measures include encryption of data in transit (SSL/TLS), hashed passwords, access controls, and regular security assessments. However, no method of transmission over the Internet is 100% secure; we cannot guarantee absolute security.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">9. Your Data Protection Rights</h2>
      <p className="mb-4">
        Depending on your jurisdiction, you may have the following rights regarding your personal data:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
        <li><strong>Right to Rectification:</strong> Correct any inaccurate or incomplete data.</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements).</li>
        <li><strong>Right to Restrict Processing:</strong> Ask us to limit how we process your data in certain circumstances.</li>
        <li><strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used format and transfer it to another controller.</li>
        <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing purposes (including profiling related to such marketing).</li>
        <li><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent at any time, without affecting the lawfulness of processing before withdrawal.</li>
      </ul>
      <p className="mb-4">
        If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, disclosed, or “sold” (as defined by CCPA). While we do not sell personal information for monetary consideration, the sharing of data with advertising instructors to serve personalized ads may be considered a “sale” under CCPA. You may opt out of such sharing by adjusting your cookie preferences or visiting the opt‑out pages listed in Section 7. To exercise any of these rights, please contact us using the details below. We will respond within the timeframe required by applicable law.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">10. Children’s Privacy</h2>
      <p className="mb-4">
        Our platform is intended for a general audience and is not directed to children under the age of 13 (or equivalent minimum age in your jurisdiction). We do not knowingly collect personal information from children under 13. If we become aware that a child has provided us with personal data without parental consent, we will take steps to delete such information promptly. If you believe we might have any information from or about a child under 13, please contact us.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">11. Third‑Party Links</h2>
      <p className="mb-4">
        Our website may contain links to external sites (e.g., payment gateways, mentors’ profiles, or instructors offers). We are not responsible for the privacy practices or content of these third‑party sites. We encourage you to review the privacy policies of any external sites you visit.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">12. International Data Transfers</h2>
      <p className="mb-4">
        Your information may be transferred to — and maintained on — servers located outside your state, province, or country, where data protection laws may differ. We ensure that any such transfers comply with applicable legal requirements by implementing appropriate safeguards, such as standard contractual clauses.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">13. Changes to This Privacy Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the “Last updated” date. We may also notify you via email or a prominent notice on our platform. Continued use after changes constitutes acceptance of the revised policy.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900">14. Contact Us</h2>
      <p className="mb-4">
        If you have any questions, concerns, or wish to exercise your data protection rights, please reach out to our Data Protection Officer at:
      </p>
      <div className="mb-4">
        <p><strong>Email:</strong> privacy@gocyn.com</p>
        <p><strong>Address:</strong> [Your Company Address, City, Country]</p>
      </div>
      <p className="mb-4">
        We are committed to resolving any complaints. If you are in the EEA or UK, you also have the right to lodge a complaint with your local supervisory authority.
      </p>

      <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
        <p>Maintained by Gocyn. All rights reserved.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;