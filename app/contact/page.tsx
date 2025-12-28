'use client'

import { useState } from 'react'
import Link from 'next/link'
import TwitterIcon from '@/components/icons/TwitterIcon'
import LinkedInIcon from '@/components/icons/LinkedInIcon'
import GitHubIcon from '@/components/icons/GitHubIcon'
import DiscordIcon from '@/components/icons/DiscordIcon'

const contactMethods = [
  {
    title: 'General Inquiries',
    description: 'Questions about xkroot, our products, or partnerships',
    email: 'hello@xkroot.com',
    icon: '📧',
  },
  {
    title: 'Business Partnerships',
    description: 'Interested in collaborating or partnering with us',
    email: 'partnerships@xkroot.com',
    icon: '🤝',
  },
  {
    title: 'Technical Support',
    description: 'Need help with our products or technical issues',
    email: 'support@xkroot.com',
    icon: '🔧',
  },
  {
    title: 'Media & Press',
    description: 'Press inquiries, interviews, or media requests',
    email: 'press@xkroot.com',
    icon: '📰',
  },
]

const socialLinks = [
  { href: 'https://twitter.com/xkroot', label: 'Twitter', icon: TwitterIcon },
  { href: 'https://linkedin.com/company/xkroot', label: 'LinkedIn', icon: LinkedInIcon },
  { href: 'https://github.com/xkroot', label: 'GitHub', icon: GitHubIcon },
  { href: 'https://discord.gg/xkroot', label: 'Discord', icon: DiscordIcon },
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          inquiryType: 'general',
        })
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitted(false)
        }, 5000)
      } else {
        alert(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      alert('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-beige-light dark:bg-black transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-300/50 dark:border-white/20 bg-purple-100/80 dark:bg-purple-600/80 backdrop-blur-sm mb-8 animate-fade-in">
              <span className="text-sm font-semibold text-purple-800 dark:text-white">Get in Touch</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-black dark:text-white leading-tight animate-fade-in delay-100">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-gray-dark dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
              Have a question, suggestion, or want to collaborate? We'd love to hear from you. Reach out and let's start a conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
                <h2 className="text-3xl font-bold mb-6 text-black dark:text-gray">Send us a Message</h2>
                
                {submitted && (
                  <div className="mb-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-500/50">
                    <p className="text-green-700 dark:text-green-400 font-semibold">
                      ✓ Thank you! Your message has been sent. We'll get back to you soon.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-[#ffdf07]"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-[#ffdf07]"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inquiryType" className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                      Inquiry Type *
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="partnership">Business Partnership</option>
                      <option value="support">Technical Support</option>
                      <option value="media">Media & Press</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold mb-2 text-black dark:text-gray">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={8}
                      className="w-full px-4 py-3 rounded-lg glass-strong text-black dark:text-gray focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full glass-strong px-8 py-4 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Quick Contact Methods */}
              <div className="glass rounded-3xl p-6 animate-fade-in-up delay-100">
                <h3 className="text-xl font-bold mb-4 text-black dark:text-gray">Quick Contact</h3>
                <div className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <div key={index} className="p-4 rounded-xl glass-strong hover:scale-105 transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{method.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-black dark:text-gray mb-1">{method.title}</h4>
                          <p className="text-xs text-gray-dark dark:text-gray-dark mb-2">{method.description}</p>
                          <a
                            href={`mailto:${method.email}`}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            {method.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media */}
              <div className="glass rounded-3xl p-6 animate-fade-in-up delay-200">
                <h3 className="text-xl font-bold mb-4 text-black dark:text-gray">Follow Us</h3>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl glass-strong hover:scale-105 transition-transform group"
                      >
                        <Icon className="w-5 h-5 text-gray-dark dark:text-gray-dark group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                        <span className="text-sm font-semibold text-black dark:text-gray">{social.label}</span>
                      </a>
                    )
                  })}
                </div>
              </div>

              {/* Office Hours */}
              <div className="glass rounded-3xl p-6 animate-fade-in-up delay-300">
                <h3 className="text-xl font-bold mb-4 text-black dark:text-gray">Response Time</h3>
                <div className="space-y-3 text-sm text-gray-dark dark:text-gray-dark">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>General inquiries: 24-48 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Support requests: 12-24 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Partnerships: 48-72 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
            <h2 className="text-3xl font-bold mb-6 text-black dark:text-gray">Other Ways to Connect</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl glass-strong">
                <h3 className="text-xl font-bold mb-3 text-black dark:text-gray">Join Our Community</h3>
                <p className="text-gray-dark dark:text-gray-dark mb-4">
                  Connect with other users, get updates, and participate in discussions on our Discord server.
                </p>
                <a
                  href="https://discord.gg/xkroot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                >
                  Join Discord
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <div className="p-6 rounded-xl glass-strong">
                <h3 className="text-xl font-bold mb-3 text-black dark:text-gray">Open Source</h3>
                <p className="text-gray-dark dark:text-gray-dark mb-4">
                  Check out our open-source projects, contribute, or report issues on GitHub.
                </p>
                <a
                  href="https://github.com/xkroot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                >
                  View on GitHub
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="container mx-auto px-4 py-16 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="glass-strong rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-gray">
              Have Questions?
            </h2>
            <p className="text-lg text-gray-dark dark:text-gray-dark mb-8 max-w-2xl mx-auto">
              Check out our whitepaper, blog, or about page for more information about xkroot and our products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/whitepaper"
                className="glass px-8 py-4 rounded-lg text-black dark:text-gray font-semibold hover:scale-105 transition-transform"
              >
                Read Whitepaper
              </Link>
              <Link
                href="/blog"
                className="glass px-8 py-4 rounded-lg text-gray-dark dark:text-gray-dark hover:text-black dark:hover:text-gray font-semibold hover:scale-105 transition-transform"
              >
                Visit Blog
              </Link>
              <Link
                href="/about"
                className="glass px-8 py-4 rounded-lg text-gray-dark dark:text-gray-dark hover:text-black dark:hover:text-gray font-semibold hover:scale-105 transition-transform"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
