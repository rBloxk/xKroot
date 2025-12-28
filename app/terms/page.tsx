import Link from 'next/link'

export default function Terms() {
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
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-gray-dark dark:text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
              Please read these terms carefully before using our services.
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">1. Acceptance of Terms</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                By accessing or using xkroot's website, products, or services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use our Services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">2. Description of Services</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                xkroot provides a suite of Web3 and AI-powered products and services, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Staytune - Social platform for Gen Z</li>
                <li>Flavours - Video sharing and monetization platform</li>
                <li>xKroot - AI-driven job portal and code editor</li>
                <li>MartSpace - Global B2B2C marketplace</li>
                <li>IFConnect - Brand-creator connection platform</li>
                <li>rOX Token - Blockchain token for ecosystem transactions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">3. User Accounts and Registration</h2>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>You must be at least 18 years old to use our Services</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to provide accurate and complete information when registering</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">4. Acceptable Use</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Transmit harmful, offensive, or illegal content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Services</li>
                <li>Use automated systems to access the Services without permission</li>
                <li>Impersonate any person or entity</li>
                <li>Collect user information without consent</li>
                <li>Engage in any fraudulent or deceptive practices</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">5. Intellectual Property</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                All content, features, and functionality of the Services, including but not limited to text, graphics, logos, icons, images, software, and code, are owned by xkroot or its licensors and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                You may not reproduce, distribute, modify, create derivative works, publicly display, or otherwise use our content without our express written permission.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">6. User Content</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                You retain ownership of content you submit to our Services. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content for the purpose of providing and improving our Services.
              </p>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                You are solely responsible for your content and represent that you have all necessary rights to grant us the license described above.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">7. Blockchain and Cryptocurrency</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                When using rOX Token or other blockchain-based features:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>You are responsible for the security of your wallet and private keys</li>
                <li>Blockchain transactions are irreversible</li>
                <li>We are not responsible for losses due to user error, wallet compromise, or network issues</li>
                <li>Cryptocurrency values are volatile and subject to market fluctuations</li>
                <li>You must comply with all applicable laws regarding cryptocurrency in your jurisdiction</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">8. Payments and Fees</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                Some Services may require payment. By making a payment, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Pay all fees associated with your use of paid Services</li>
                <li>Provide accurate payment information</li>
                <li>Authorize us to charge your payment method</li>
                <li>Understand that fees are non-refundable unless otherwise stated</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">9. Disclaimers and Limitations of Liability</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                <strong>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong>
              </p>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                To the maximum extent permitted by law, xkroot disclaims all warranties and shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">10. Indemnification</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                You agree to indemnify and hold harmless xkroot, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Services or violation of these Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">11. Termination</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Services at our sole discretion, without prior notice, for any reason, including if you breach these Terms.
              </p>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                Upon termination, your right to use the Services will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">12. Governing Law</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these Terms or the Services shall be resolved through binding arbitration or in the appropriate courts.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">13. Changes to Terms</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on this page. Your continued use of the Services after such changes constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">14. Contact Information</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="glass-strong rounded-xl p-6">
                <p className="text-lg text-gray-dark dark:text-gray-dark mb-2">
                  <strong className="text-black dark:text-gray">Email:</strong> <a href="mailto:legal@xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">legal@xkroot.com</a>
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark">
                  <strong className="text-black dark:text-gray">Address:</strong> xkroot Legal Department
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
