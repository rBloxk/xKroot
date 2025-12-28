'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '@/contexts/ThemeContext'
import TwitterIcon from './icons/TwitterIcon'
import LinkedInIcon from './icons/LinkedInIcon'
import GitHubIcon from './icons/GitHubIcon'
import DiscordIcon from './icons/DiscordIcon'

const socialLinks = [
  { href: 'https://twitter.com', label: 'Twitter', icon: TwitterIcon },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: LinkedInIcon },
  { href: 'https://github.com', label: 'GitHub', icon: GitHubIcon },
  { href: 'https://discord.com', label: 'Discord', icon: DiscordIcon },
]


const companyLinks = [
  { href: '', label: '' },
  { href: '', label: '' },
  { href: '', label: '' },
  { href: '', label: '' },
]

const resourceLinks = [
  { href: '', label: '' },
  { href: '', label: '' },
  { href: '', label: '' },
  { href: '', label: '' },
  { href: '', label: '' },
]

const legalLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/legal', label: 'Legal' },
]

export default function Footer() {
  const { theme } = useTheme()

  // Choose logo based on theme
  const logoSrc = theme === 'dark' 
    ? '/images/xkroot-logo-white.png' 
    : '/images/xkroot-logo.png'

  return (
    <footer className="glass-strong border-t border-white/20 dark:border-white/10 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src={logoSrc}
                alt="xkroot logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <span className="text-lg font-bold text-gray-dark dark:text-gray-300 block mb-2">xkroot</span>
            <p className="text-sm text-gray-dark dark:text-gray-300 mb-4">Hire, Create, Develop</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Connecting companies with talented candidates.<br />
              Building the future of recruitment and professional development.
            </p>
          </div>

      

          {/* For Companies */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-black dark:text-white">For Companies</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Legal */}
          <div>
            <h3 className="text-base font-semibold mb-4 text-black dark:text-white">Resources</h3>
            <ul className="space-y-2 mb-6">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-4 text-black dark:text-white">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Connect Section */}
        <div className="mt-8 pt-8 border-t border-white/20 dark:border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-semibold mb-4 text-black dark:text-white">Connect With Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon
                  return (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                      aria-label={social.label}
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">System Status</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/20 dark:border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 dark:text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} xkroot. </p>
            <div className="mt-4 md:mt-0 flex gap-4">
              <p>A rbloxk company. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

