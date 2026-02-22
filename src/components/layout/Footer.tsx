'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, Linkedin, ChevronDown, ExternalLink } from 'lucide-react'
import { AnimatedLogo } from './AnimatedLogo'
import { cn } from '@/lib/utils'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [openSection, setOpenSection] = useState<string | null>(null)

  const footerSections = [
    {
      title: 'Navigation',
      links: [
        { name: 'Trending Anime', href: '/anime?filter=airing' },
        { name: 'Seasonal Chart', href: '/seasons' },
        { name: 'Manga Library', href: '/manga' },
        { name: 'Movie Archive', href: '/movies' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Community Guidelines', href: '/guidelines' },
        { name: 'Discussion Forum', href: '#' },
        { name: 'Support Center', href: '/contact' },
        { name: 'Discord Community', href: 'https://discord.com' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'DMCA Notice', href: '/dmca' },
      ],
    },
  ]

  const socialIcons = [
    {
      icon: Github,
      href: 'https://github.com/Ilyas-Nour',
      label: 'GitHub',
      color: 'hover:text-white hover:bg-white/10'
    },
    {
      icon: Linkedin,
      href: 'https://www.linkedin.com/in/ilyasnour/',
      label: 'LinkedIn',
      color: 'hover:text-[#0077B5] hover:bg-[#0077B5]/10'
    },
  ]

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title)
  }

  return (
    <footer className="w-full bg-background border-t border-white/5 pt-16 pb-24 md:pb-12 overflow-hidden relative">
      {/* Subtle Background Accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* 1. Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="flex flex-col items-center lg:items-start space-y-6">
              <AnimatedLogo className="scale-110 lg:origin-left" />
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm text-center lg:text-left">
                The ultimate destination for anime enthusiasts. Discover trending shows, track your progress, and join a global community of otaku.
              </p>
              <div className="flex gap-3">
                {socialIcons.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "h-11 w-11 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-muted-foreground transition-all duration-300 hover:scale-105 hover:border-white/10",
                      social.color
                    )}
                    aria-label={social.label}
                  >
                    <social.icon size={20} />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 2. Nav Sections */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {footerSections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-6"
              >
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between md:cursor-default md:pointer-events-none"
                >
                  <h4 className="font-bold text-[11px] uppercase tracking-[0.2em] text-foreground/40">{section.title}</h4>
                  <motion.div
                    animate={{ rotate: openSection === section.title ? 180 : 0 }}
                    className="md:hidden p-1.5 bg-white/5 rounded-xl border border-white/5"
                  >
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </motion.div>
                </button>

                {/* Mobile / Desktop List */}
                <AnimatePresence mode="wait">
                  {(openSection === section.title || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden md:!h-auto md:!opacity-100"
                    >
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <Link
                            href={link.href}
                            className="text-muted-foreground/80 text-sm hover:text-foreground transition-colors flex items-center gap-2 group"
                          >
                            <span className="h-[1px] w-0 bg-primary group-hover:w-3 transition-all duration-300" />
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-[13px] text-muted-foreground/60">
            <span>© {currentYear} <span className="text-foreground/80 font-semibold tracking-tight">Animy</span></span>
            <span className="hidden md:block h-1 w-1 rounded-full bg-white/10" />
            <span className="flex items-center gap-1">
              Developed by <Link href="https://github.com/Ilyas-Nour" target="_blank" className="text-foreground/80 hover:text-primary transition-colors font-medium">Ilyas Nour</Link>
            </span>
          </div>

          <div className="flex items-center gap-8 text-[13px] font-medium text-muted-foreground/60">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
