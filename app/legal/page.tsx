import Link from 'next/link'

export default function Legal() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-beige-light dark:bg-black transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-300/50 dark:border-white/20 bg-purple-100/80 dark:bg-purple-600/80 backdrop-blur-sm mb-8 animate-fade-in">
              <span className="text-sm font-semibold text-purple-800 dark:text-white">Legal Information</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black dark:text-white leading-tight animate-fade-in delay-100">
              Legal Information
            </h1>
            <p className="text-lg md:text-xl text-gray-dark dark:text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
              Important legal information about xkroot, our services, and your rights.
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Company Information</h2>
              <div className="glass-strong rounded-xl p-6 space-y-3">
                <p className="text-lg text-gray-dark dark:text-gray-dark">
                  <strong className="text-black dark:text-gray">Company Name:</strong> xkroot
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark">
                  <strong className="text-black dark:text-gray">Website:</strong> <a href="https://xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">xkroot.com</a>
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark">
                  <strong className="text-black dark:text-gray">Contact Email:</strong> <a href="mailto:legal@xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">legal@xkroot.com</a>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Legal Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/privacy" className="glass-strong rounded-xl p-6 hover:scale-105 transition-transform">
                  <h3 className="text-xl font-bold mb-2 text-black dark:text-gray">Privacy Policy</h3>
                  <p className="text-sm text-gray-dark dark:text-gray-dark">
                    How we collect, use, and protect your personal information
                  </p>
                </Link>
                <Link href="/terms" className="glass-strong rounded-xl p-6 hover:scale-105 transition-transform">
                  <h3 className="text-xl font-bold mb-2 text-black dark:text-gray">Terms of Service</h3>
                  <p className="text-sm text-gray-dark dark:text-gray-dark">
                    Rules and guidelines for using our services
                  </p>
                </Link>
                <Link href="/cookies" className="glass-strong rounded-xl p-6 hover:scale-105 transition-transform">
                  <h3 className="text-xl font-bold mb-2 text-black dark:text-gray">Cookie Policy</h3>
                  <p className="text-sm text-gray-dark dark:text-gray-dark">
                    Information about our use of cookies and tracking technologies
                  </p>
                </Link>
                <Link href="/whitepaper" className="glass-strong rounded-xl p-6 hover:scale-105 transition-transform">
                  <h3 className="text-xl font-bold mb-2 text-black dark:text-gray">Whitepaper</h3>
                  <p className="text-sm text-gray-dark dark:text-gray-dark">
                    Technical documentation and tokenomics information
                  </p>
                </Link>
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Intellectual Property</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                All content, trademarks, logos, and intellectual property on this website are the property of xkroot or its licensors. Unauthorized use, reproduction, or distribution of any content is strictly prohibited.
              </p>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                If you believe that any content on our website infringes your intellectual property rights, please contact us at <a href="mailto:legal@xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">legal@xkroot.com</a> with details of your claim.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Disclaimer</h2>
              <div className="glass-strong rounded-xl p-6 space-y-4">
                <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                  <strong className="text-black dark:text-gray">No Investment Advice:</strong> Information provided on this website, including information about rOX Token, does not constitute investment, financial, trading, or legal advice. Cryptocurrency investments carry significant risk.
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                  <strong className="text-black dark:text-gray">No Warranty:</strong> We provide our services "as is" without warranties of any kind. We do not guarantee that our services will be uninterrupted, secure, or error-free.
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                  <strong className="text-black dark:text-gray">Regulatory Compliance:</strong> Users are responsible for ensuring their use of our services complies with all applicable laws and regulations in their jurisdiction.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Cryptocurrency and Blockchain Risks</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                <strong>Important Warning:</strong> Cryptocurrency and blockchain technologies involve significant risks:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Price volatility - cryptocurrency values can fluctuate dramatically</li>
                <li>Regulatory uncertainty - laws and regulations may change</li>
                <li>Technical risks - smart contract bugs, network issues, or security breaches</li>
                <li>Irreversible transactions - blockchain transactions cannot be undone</li>
                <li>Loss of private keys - losing access to your wallet means losing your assets</li>
                <li>No central authority - no bank or government backing</li>
              </ul>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mt-4">
                Only invest what you can afford to lose. Consult with a qualified financial advisor before making investment decisions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Compliance and Regulations</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                xkroot operates in compliance with applicable laws and regulations. However:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Cryptocurrency regulations vary by jurisdiction</li>
                <li>Some jurisdictions may restrict or prohibit cryptocurrency use</li>
                <li>Users are responsible for compliance with local laws</li>
                <li>We may restrict access from certain jurisdictions</li>
                <li>Regulatory changes may affect our services</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Dispute Resolution</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                Any disputes arising from your use of our services shall be resolved through:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Good faith negotiation</li>
                <li>Binding arbitration (if negotiation fails)</li>
                <li>Jurisdiction in appropriate courts (as a last resort)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Updates and Changes</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                We reserve the right to update, modify, or discontinue any aspect of our services at any time. We will make reasonable efforts to notify users of material changes through our website or email.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">Contact Information</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                For legal inquiries, please contact:
              </p>
              <div className="glass-strong rounded-xl p-6">
                <p className="text-lg text-gray-dark dark:text-gray-dark mb-2">
                  <strong className="text-black dark:text-gray">Legal Department:</strong>
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark mb-2">
                  <strong className="text-black dark:text-gray">Email:</strong> <a href="mailto:legal@xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">legal@xkroot.com</a>
                </p>
                <p className="text-lg text-gray-dark dark:text-gray-dark">
                  <strong className="text-black dark:text-gray">General Inquiries:</strong> <a href="mailto:hello@xkroot.com" className="text-purple-600 dark:text-purple-400 hover:underline">hello@xkroot.com</a>
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-white/20 dark:border-gray-dark/30">
              <p className="text-sm text-gray-dark dark:text-gray-dark text-center">
                This legal information is provided for general informational purposes only and does not constitute legal advice. Please consult with a qualified attorney for legal advice specific to your situation.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
