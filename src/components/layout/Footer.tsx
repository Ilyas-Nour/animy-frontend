'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Twitter, Instagram, Disc as Discord, Github, Heart, ChevronDown } from 'lucide-react'
import { AnimatedLogo } from './AnimatedLogo'
import { cn } from '@/lib/utils'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [openSection, setOpenSection] = useState<string | null>(null)

  const footerSections = [
    {
      title: 'Discover',
      links: [
        { name: 'Trending', href: '/anime?filter=airing' },
        { name: 'Current Season', href: '/seasons' },
        { name: 'Top Manga', href: '/manga' },
        { name: 'Latest Movies', href: '/movies' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Guidelines', href: '/guidelines' },
        { name: 'Official Blog', href: '/blog' },
        { name: 'Merchandise', href: '#' },
        { name: 'Discord', href: 'https://discord.com' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Settings', href: '/cookies' },
        { name: 'Contact', href: '/contact' },
      ],
    },
  ]

  const socialIcons = [
    { icon: Twitter, href: '#', label: 'X (Twitter)', color: 'hover:text-sky-400' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-500' },
    { icon: Discord, href: '#', label: 'Discord', color: 'hover:text-indigo-500' },
    { icon: Github, href: '#', label: 'GitHub', color: 'hover:text-white' },
  ]

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title)
  }

  return (
    <footer className="w-full bg-background border-t border-white/5 pt-16 pb-24 md:pb-16 overflow-hidden">
      <div className="container px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* 1. Brand Section (lg: 3 cols - 25%) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6"
          >
            <AnimatedLogo className="scale-125 lg:scale-110 lg:origin-left" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your Daily Otaku Lifestyle. Discover, track, and share your favorite anime and manga experiences with the community.
            </p>
            <div className="flex gap-4">
              {socialIcons.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-muted-foreground transition-all hover:scale-110 hover:border-white/10",
                    social.color
                  )}
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* 2. Nav Sections (lg: 9 cols - 75%) */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-8 lg:pl-12">
            {footerSections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-4 md:space-y-6"
              >
                {/* Mobile Header (Button) */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between md:cursor-default md:pointer-events-none group"
                >
                  <h4 className="font-black text-sm uppercase tracking-widest text-foreground/80">{section.title}</h4>
                  <motion.div
                    animate={{ rotate: openSection === section.title ? 180 : 0 }}
                    className="md:hidden p-1 bg-white/5 rounded-lg"
                  >
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </motion.div>
                </button>

                {/* Content - Hidden on mobile unless open */}
                <AnimatePresence mode="wait">
                  {openSection === section.title ? (
                    <motion.ul
                      key={`footer-list-${section.title}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden md:hidden"
                    >
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <Link
                            href={link.href}
                            className="text-muted-foreground text-sm hover:text-primary transition-all flex items-center gap-2 group py-1"
                          >
                            <span className="h-1 w-1 rounded-full bg-primary/40 group-hover:w-2 group-hover:bg-primary transition-all" />
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  ) : null}
                </AnimatePresence>

                {/* Always visible on Desktop */}
                <ul className="hidden md:block space-y-3">
                  {section.links.map((link) => (
                    <li key={`desktop-${link.name}`}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground text-sm hover:text-primary transition-all flex items-center gap-2 group py-1"
                      >
                        <span className="h-1 w-1 rounded-full bg-primary/40 group-hover:w-2 group-hover:bg-primary transition-all" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 border-t border-white/5 py-8 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0"
        >
          <div className="text-xs text-muted-foreground font-medium order-2 md:order-1">
            © {currentYear} <span className="text-foreground font-bold">Animy</span>. All rights reserved.
          </div>

          <div className="flex flex-row items-center gap-6 text-xs order-1 md:order-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Systems Normal</span>
            </div>

            <div className="text-muted-foreground flex items-center gap-1.5 font-medium whitespace-nowrap">
              Made with <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><Heart size={12} className="text-red-500 fill-current" /></motion.span> by <span className="text-foreground font-bold">Ilyas Nour</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
