import Link from 'next/link'

export default function Privacy() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-beige-light dark:bg-black transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-300/50 dark:border-white/20 bg-purple-100/80 dark:bg-purple-600/80 backdrop-blur-sm mb-8 animate-fade-in">
              <span className="text-sm font-semibold text-purple-800 dark:text-white">Legal Document</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black dark:text-white leading-tight animate-fade-in delay-100">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-gray-dark dark:text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-gray-dark dark:text-gray-400 animate-fade-in delay-300">
              Last Updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-16 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 space-y-8">
            
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">1. Introduction</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                xkroot ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                By using our website and services, you consent to the data practices described in this policy. If you do not agree with the practices described, please do not use our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark mb-4 ml-4">
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials and profile information</li>
                <li>Payment and transaction information</li>
                <li>Content you submit (blog posts, job applications, contact messages)</li>
                <li>Communications with us (support requests, feedback)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark mb-4 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, click patterns)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (if permitted)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">2.3 Blockchain-Related Information</h3>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Wallet addresses and transaction history (when using rOX Token)</li>
                <li>Smart contract interactions</li>
                <li>On-chain activity data</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">3. How We Use Your Information</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>To provide, maintain, and improve our services</li>
                <li>To process transactions and manage your account</li>
                <li>To communicate with you about our services, updates, and promotions</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations and enforce our terms</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To personalize content and recommendations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">4. Information Sharing and Disclosure</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (hosting, analytics, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
                <li><strong>Blockchain Networks:</strong> Transaction data on blockchain networks is publicly visible by design</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">5. Data Security</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and updates</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">6. Your Rights and Choices</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data</li>
                <li><strong>Objection:</strong> Object to processing of your information</li>
                <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:privacy@xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">privacy@xkroot.com</a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">7. Cookies and Tracking Technologies</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                We use cookies and similar technologies to enhance your experience. For detailed information, please see our <Link href="/cookies" className="text-purple-600 dark:text-purple-400 hover:underline">Cookie Policy</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">8. Third-Party Links</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">9. Children's Privacy</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">10. International Data Transfers</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">11. Changes to This Policy</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">12. Contact Us</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="glass-strong rounded-xl p-6">
                <p className="text-lg text-gray-dark dark:text-gray-dark mb-2">
                  <strong className="text-black dark:text-gray">Email:</strong> <a href="mailto:privacy@xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">privacy@xkroot.com</a>
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark">
                  <strong className="text-black dark:text-gray">Address:</strong> xkroot Privacy Team
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
