'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Bookmark, Star, Users, Bell, BookOpen, Shield, Zap, ArrowRight, Sparkles
} from 'lucide-react'
import { FaGoogle } from 'react-icons/fa'

const benefits = [
  { icon: Bookmark, label: 'Track your watchlist & manga' },
  { icon: Star,     label: 'Get personalized recommendations' },
  { icon: Users,    label: 'Connect with 10,000+ anime fans' },
  { icon: Bell,     label: 'Never miss a new episode' },
  { icon: BookOpen, label: 'Read unlimited manga chapters' },
  { icon: Shield,   label: '100% Free — No credit card needed' },
]

interface GuestSignupBannerProps {
  /**
   * Seconds of browsing before the popup auto-appears.
   * Defaults to 45 s.
   */
  delaySeconds?: number
}

export function GuestSignupBanner({ delaySeconds = 45 }: GuestSignupBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem('animy_signup_shown')) return

    const timer = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem('animy_signup_shown', '1')
    }, delaySeconds * 1000)

    return () => clearTimeout(timer)
  }, [delaySeconds])

  const dismiss = () => setVisible(false)

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Soft backdrop — click outside to dismiss */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]"
            onClick={dismiss}
          />

          {/* Modal card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Background image ─────────────────────────────── */}
              <div className="absolute inset-0">
                <Image
                  src="/MULTIPLE.jpg"
                  alt="Anime characters"
                  fill
                  className="object-cover object-center"
                  priority
                />
                {/* Dark gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>

              {/* ── Close button ──────────────────────────────────── */}
              <button
                onClick={dismiss}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* ── Content ───────────────────────────────────────── */}
              <div className="relative z-10 p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">

                {/* Left — copy & benefits */}
                <div className="space-y-5">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Free Forever
                  </div>

                  {/* Headline */}
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                      Join the{' '}
                      <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Animy
                      </span>{' '}
                      Community
                    </h2>
                    <p className="text-white/55 text-sm mt-2 leading-relaxed">
                      Create your free account and unlock the full anime & manga experience.
                    </p>
                  </div>

                  {/* Benefits grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {benefits.map((b) => (
                      <div key={b.label} className="flex items-center gap-2.5">
                        <div className="shrink-0 w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                          <b.icon className="w-3.5 h-3.5 text-violet-300" />
                        </div>
                        <span className="text-white/70 text-xs font-medium">{b.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <Link
                      href="/auth/register"
                      onClick={dismiss}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 hover:from-blue-500 hover:via-violet-500 hover:to-pink-500 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all group"
                    >
                      <Zap className="w-4 h-4" />
                      Create Free Account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <button
                      onClick={() => {
                        dismiss()
                        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
                      }}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 transition-all"
                    >
                      <FaGoogle className="w-4 h-4 text-red-400" />
                      Continue with Google
                    </button>
                  </div>

                  <p className="text-white/35 text-xs text-center sm:text-left">
                    Already have an account?{' '}
                    <Link href="/auth/login" onClick={dismiss} className="text-violet-400 hover:text-violet-300 font-semibold">
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* Right — decorative character peek (desktop only) */}
                <div className="hidden md:block w-36 shrink-0 self-stretch relative">
                  {/* This space intentionally left so the background artwork is visible on the right */}
                </div>
              </div>

              {/* Bottom shimmer accent */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 opacity-80" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
