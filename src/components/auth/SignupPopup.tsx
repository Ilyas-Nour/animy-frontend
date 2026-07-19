'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { IoClose } from 'react-icons/io5'
import {
  PiBookmarkSimpleFill,
  PiStarFill,
  PiUsersFill,
  PiBellFill,
  PiBookOpenFill,
  PiShieldCheckFill,
  PiLightningFill,
  PiArrowRightBold,
} from 'react-icons/pi'
import { FcGoogle } from 'react-icons/fc'

const benefits = [
  {
    icon: PiBookmarkSimpleFill,
    label: 'Personal Watchlist',
    desc: 'Track every anime & manga in one place',
    color: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: PiStarFill,
    label: 'Smart Recommendations',
    desc: 'AI-curated picks tailored to your taste',
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: PiUsersFill,
    label: 'Vibrant Community',
    desc: 'Connect with thousands of anime fans',
    color: 'from-violet-500/20 to-violet-600/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: PiBellFill,
    label: 'Release Alerts',
    desc: 'Never miss a new episode or chapter',
    color: 'from-rose-500/20 to-rose-600/10',
    iconColor: 'text-rose-400',
  },
  {
    icon: PiBookOpenFill,
    label: 'Unlimited Reading',
    desc: 'Access thousands of manga chapters',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: PiShieldCheckFill,
    label: 'Always Free',
    desc: 'No credit card. No hidden fees. Ever.',
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
  },
]

interface GuestSignupBannerProps {
  delaySeconds?: number
}

export function GuestSignupBanner({ delaySeconds = 45 }: GuestSignupBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
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
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-3xl rounded-[28px] overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.8)] border border-white/[0.08]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ─── Anime Background ─────────────────────────────────────── */}
              <div className="absolute inset-0">
                <Image
                  src="/MULTIPLE.jpg"
                  alt="Anime community"
                  fill
                  className="object-cover object-center scale-105"
                  priority
                />
                {/* Premium multi-layer gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/98 via-[#0a0a14]/85 to-[#0a0a14]/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/80 via-transparent to-[#0a0a14]/40" />
              </div>

              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-500/70 to-transparent" />

              {/* ─── Close Button ─────────────────────────────────────────── */}
              <button
                onClick={dismiss}
                aria-label="Close"
                className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/[0.15] text-white/50 hover:text-white transition-all duration-200 backdrop-blur-sm"
              >
                <IoClose className="w-5 h-5" />
              </button>

              {/* ─── Content ──────────────────────────────────────────────── */}
              <div className="relative z-10 p-9 md:p-12">
                {/* Header section */}
                <div className="mb-7">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/[0.12] border border-violet-500/20 mb-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-violet-300 text-xs font-semibold tracking-wide uppercase">Free Forever</span>
                  </div>

                  <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight mb-3">
                    Join the{' '}
                    <span className="relative">
                      <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Animy
                      </span>
                    </span>
                    {' '}Universe
                  </h2>
                  <p className="text-white/50 text-base leading-relaxed max-w-md">
                    Your ultimate destination for anime & manga. Create your free account and unlock the full experience.
                  </p>
                </div>

                {/* Benefits grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {benefits.map((b, i) => (
                    <motion.div
                      key={b.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.06 }}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-br ${b.color} border border-white/[0.06] backdrop-blur-sm`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <b.icon className={`w-5 h-5 ${b.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-white/90 text-xs font-bold leading-snug">{b.label}</p>
                        <p className="text-white/40 text-[11px] mt-0.5 leading-snug">{b.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/[0.06] mb-7" />

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Primary CTA */}
                  <Link
                    href="/auth/register"
                    onClick={dismiss}
                    className="flex-1 group relative flex items-center justify-center gap-2.5 h-13 px-6 py-3.5 rounded-2xl overflow-hidden font-bold text-sm text-white transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 group-hover:from-blue-500 group-hover:via-violet-500 group-hover:to-pink-500 transition-all duration-300" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-400/20 via-violet-400/20 to-pink-400/20 transition-opacity duration-300" />
                    <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                    <span className="relative flex items-center gap-2.5">
                      <PiLightningFill className="w-4 h-4 text-yellow-300" />
                      Create Free Account
                      <PiArrowRightBold className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                  </Link>

                  {/* Google CTA */}
                  <button
                    onClick={() => {
                      dismiss()
                      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
                    }}
                    className="flex-1 group relative flex items-center justify-center gap-3 h-13 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white/90 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] hover:border-white/[0.20] transition-all duration-200 backdrop-blur-sm overflow-hidden"
                  >
                    <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />
                    <FcGoogle className="w-5 h-5 shrink-0" />
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Footer */}
                <p className="text-center text-white/30 text-xs mt-5">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    onClick={dismiss}
                    className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                  >
                    Sign in
                  </Link>
                  {' · '}
                  <button onClick={dismiss} className="text-white/30 hover:text-white/50 transition-colors">
                    Maybe later
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
