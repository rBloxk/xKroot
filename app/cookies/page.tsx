import Link from 'next/link'

export default function Cookies() {
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
              Cookie Policy
            </h1>
            <p className="text-lg md:text-xl text-gray-dark dark:text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
              Learn about how we use cookies and similar technologies on our website.
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">1. What Are Cookies?</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                Cookies allow websites to recognize your device and store some information about your preferences or past actions. This helps improve your browsing experience and allows websites to provide personalized content.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">2. How We Use Cookies</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                xkroot uses cookies and similar technologies for the following purposes:
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">2.1 Essential Cookies</h3>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4 mb-6">
                <li>Authentication and session management</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing and performance</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">2.2 Functional Cookies</h3>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                These cookies enhance functionality and personalization, such as remembering your preferences and settings.
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4 mb-6">
                <li>Theme preferences (light/dark mode)</li>
                <li>Language and region settings</li>
                <li>User interface preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">2.3 Analytics Cookies</h3>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4 mb-6">
                <li>Page views and navigation patterns</li>
                <li>Time spent on pages</li>
                <li>Error tracking and performance monitoring</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">2.4 Marketing Cookies</h3>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                These cookies are used to deliver relevant advertisements and track campaign effectiveness.
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li>Ad targeting and personalization</li>
                <li>Campaign performance measurement</li>
                <li>Cross-site tracking (if applicable)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">3. Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div className="glass-strong rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black dark:text-gray">Session Cookies</h3>
                  <p className="text-lg text-gray-dark dark:text-gray-dark">
                    Temporary cookies that are deleted when you close your browser. They help maintain your session while browsing.
                  </p>
                </div>

                <div className="glass-strong rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black dark:text-gray">Persistent Cookies</h3>
                  <p className="text-lg text-gray-dark dark:text-gray-dark">
                    Cookies that remain on your device for a set period or until you delete them. They remember your preferences across sessions.
                  </p>
                </div>

                <div className="glass-strong rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black dark:text-gray">First-Party Cookies</h3>
                  <p className="text-lg text-gray-dark dark:text-gray-dark">
                    Cookies set directly by xkroot on our website. These are used to provide core functionality and improve user experience.
                  </p>
                </div>

                <div className="glass-strong rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2 text-black dark:text-gray">Third-Party Cookies</h3>
                  <p className="text-lg text-gray-dark dark:text-gray-dark">
                    Cookies set by third-party services integrated into our website, such as analytics providers or advertising networks.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">4. Third-Party Cookies</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                We may use third-party services that set their own cookies. These include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li><strong>Analytics Services:</strong> Google Analytics, Vercel Analytics (for website usage statistics)</li>
                <li><strong>Hosting Services:</strong> Vercel, Supabase (for service functionality)</li>
                <li><strong>Social Media:</strong> Social media platforms (if you interact with social features)</li>
              </ul>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mt-4">
                These third parties have their own privacy policies and cookie practices. We encourage you to review their policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">5. Managing Cookies</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                You have control over cookies. Most web browsers allow you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4 mb-4">
                <li>View and delete cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Set preferences for cookie acceptance</li>
              </ul>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                <strong>Note:</strong> Blocking or deleting cookies may impact your experience on our website. Some features may not function properly if cookies are disabled.
              </p>
              <div className="glass-strong rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-3 text-black dark:text-gray">Browser-Specific Instructions:</h3>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                  <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                  <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                  <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">6. Local Storage and Similar Technologies</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                In addition to cookies, we may use other storage technologies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-lg text-gray-dark dark:text-gray-dark ml-4">
                <li><strong>Local Storage:</strong> Stores data in your browser (e.g., theme preferences)</li>
                <li><strong>Session Storage:</strong> Temporary storage for the current session</li>
                <li><strong>Web Beacons:</strong> Small images used to track email opens and page views</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">7. Do Not Track Signals</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                Some browsers include a "Do Not Track" (DNT) feature. Currently, there is no standard for how websites should respond to DNT signals. We do not currently respond to DNT browser signals, but we respect your cookie preferences through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">8. Updates to This Policy</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page.
              </p>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black dark:text-gray">9. Contact Us</h2>
              <p className="text-lg text-gray-dark dark:text-gray-dark leading-relaxed mb-4">
                If you have questions about our use of cookies, please contact us:
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
