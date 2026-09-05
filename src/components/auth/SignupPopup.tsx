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
import { AnimatedLogo } from '@/components/layout/AnimatedLogo'

const benefits = [
  {
    icon: PiBookmarkSimpleFill,
    label: 'Watchlist',
    desc: 'Track every anime & manga',
    color: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-400',
    solidColor: 'bg-blue-500/20',
  },
  {
    icon: PiStarFill,
    label: 'AI Picks',
    desc: 'Curated for your taste',
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
    solidColor: 'bg-amber-500/20',
  },
  {
    icon: PiUsersFill,
    label: 'Community',
    desc: 'Thousands of anime fans',
    color: 'from-violet-500/20 to-violet-600/10',
    iconColor: 'text-violet-400',
    solidColor: 'bg-violet-500/20',
  },
  {
    icon: PiBellFill,
    label: 'Alerts',
    desc: 'New episodes & chapters',
    color: 'from-rose-500/20 to-rose-600/10',
    iconColor: 'text-rose-400',
    solidColor: 'bg-rose-500/20',
  },
  {
    icon: PiBookOpenFill,
    label: 'Manga',
    desc: 'Thousands of chapters',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
    solidColor: 'bg-emerald-500/20',
  },
  {
    icon: PiShieldCheckFill,
    label: 'Always Free',
    desc: 'No hidden fees. Ever.',
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
    solidColor: 'bg-cyan-500/20',
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* ─────────────── MOBILE: Bottom Sheet ─────────────── */}
          <motion.div
            key="mobile-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[201] rounded-t-[28px] overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,0.8)]"
            style={{ maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background image layer */}
            <div className="absolute inset-0 bg-[#08080f]">
              <Image
                src="/all.jpg"
                alt="Anime"
                fill
                className="object-cover object-[60%_20%] opacity-30"
                priority
              />
              {/* Bottom fade to keep bottom clean */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] via-[#08080f]/80 to-transparent" />
              {/* Accent glow at top */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
            </div>

            {/* Drag handle pill */}
            <div className="relative z-10 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Content */}
            <div className="relative z-10 px-5 pb-8 pt-3 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 20px)' }}>

              {/* Top row: logo + close */}
              <div className="flex items-center justify-between mb-5">
                <AnimatedLogo innerClassName="text-white" />
                <button
                  onClick={dismiss}
                  aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/60 hover:text-white transition-all"
                >
                  <IoClose className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Headline */}
              <div className="mb-5">
                <h2 className="text-[26px] font-black text-white leading-[1.1] tracking-tight mb-2">
                  Join the{' '}
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 blur-md opacity-60" />
                    <span className="relative bg-gradient-to-r from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                      Animy
                    </span>
                  </span>
                  {' '}Universe
                </h2>
                <p className="text-white/55 text-[13px] leading-relaxed">
                  Your ultimate anime & manga hub. Free forever.
                </p>
              </div>

              {/* Benefits — compact 2-column chip grid */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border border-white/8 ${b.solidColor} backdrop-blur-sm`}
                  >
                    <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${b.color}`}>
                      <b.icon className={`w-3.5 h-3.5 ${b.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white/90 text-[11.5px] font-bold leading-tight truncate">{b.label}</div>
                      <div className="text-white/40 text-[10px] leading-tight truncate">{b.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA: Create Account */}
              <Link
                href="/auth/register"
                onClick={dismiss}
                className="group relative flex items-center justify-center gap-2 w-full h-[52px] rounded-2xl overflow-hidden font-bold text-[15px] text-white mb-3 shadow-[0_0_30px_rgba(139,92,246,0.35)] hover:shadow-[0_0_50px_rgba(139,92,246,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 mix-blend-overlay transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  <PiLightningFill className="w-4 h-4 text-yellow-300" />
                  Create Free Account
                  <PiArrowRightBold className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </Link>

              {/* CTA: Google */}
              <button
                onClick={() => {
                  dismiss()
                  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
                }}
                className="group relative flex items-center justify-center gap-2.5 w-full h-[48px] rounded-2xl font-semibold text-[14px] text-white/80 hover:text-white bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md mb-5 active:scale-[0.98]"
              >
                <FcGoogle className="w-5 h-5 shrink-0" />
                <span>Continue with Google</span>
              </button>

              {/* Footer */}
              <div className="flex items-center justify-center gap-2 text-[12px]">
                <span className="text-white/35">Already have an account?</span>
                <Link
                  href="/auth/login"
                  onClick={dismiss}
                  className="text-violet-400 hover:text-violet-300 font-bold transition-colors"
                >
                  Sign in
                </Link>
              </div>

            </div>
          </motion.div>

          {/* ─────────────── DESKTOP: Centered Two-Column Modal ─────────────── */}
          <motion.div
            key="desktop-card"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="hidden md:flex fixed inset-0 z-[201] items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-[1100px] min-h-[600px] rounded-[32px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-[#0a0a14]">
                <Image
                  src="/all.jpg"
                  alt="Anime community"
                  fill
                  className="object-cover object-[70%_30%]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07070c] via-[#07070c]/90 to-transparent w-[65%]" />
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
              </div>

              {/* Close */}
              <button
                onClick={dismiss}
                aria-label="Close"
                className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/80 border border-white/20 hover:border-white/40 text-white/70 hover:text-white transition-all duration-300 backdrop-blur-md"
              >
                <IoClose className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-center h-full p-10 lg:p-14 w-[60%]">

                <div className="mb-8">
                  <AnimatedLogo innerClassName="text-white scale-125 origin-left" />
                </div>

                <div className="mb-8">
                  <h2 className="text-4xl lg:text-[52px] font-black text-white leading-[1.05] tracking-tight mb-4 drop-shadow-xl">
                    Join the{' '}
                    <span className="relative inline-block">
                      <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 blur-lg opacity-50" />
                      <span className="relative bg-gradient-to-r from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                        Animy
                      </span>
                    </span>
                    <br />Universe
                  </h2>
                  <p className="text-white/70 text-lg leading-relaxed max-w-[420px] font-medium drop-shadow-md">
                    Your ultimate destination for anime & manga. Create your free account and unlock the full experience today.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-10 max-w-[500px]">
                  {benefits.map((b, i) => (
                    <motion.div
                      key={b.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                      className="flex items-center gap-3.5 group"
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${b.color} border border-white/5 shadow-inner shadow-white/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <b.icon className={`w-5 h-5 ${b.iconColor}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/95 text-[13px] font-bold leading-tight tracking-wide">{b.label}</span>
                        <span className="text-white/40 text-[11px] leading-snug mt-0.5">{b.desc}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 max-w-[500px]">
                  <Link
                    href="/auth/register"
                    onClick={dismiss}
                    className="flex-1 group relative flex items-center justify-center gap-2.5 h-14 px-8 rounded-2xl overflow-hidden font-bold text-base text-white transition-all duration-300 shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] hover:-translate-y-0.5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 transition-all duration-300" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 mix-blend-overlay transition-opacity duration-300" />
                    <span className="relative flex items-center gap-2.5">
                      <PiLightningFill className="w-5 h-5 text-yellow-300" />
                      Create Account
                      <PiArrowRightBold className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      dismiss()
                      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
                    }}
                    className="flex-1 group relative flex items-center justify-center gap-3 h-14 px-6 rounded-2xl font-bold text-[15px] text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md hover:-translate-y-0.5"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FcGoogle className="w-6 h-6 shrink-0 drop-shadow-md" />
                    <span>Google</span>
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-6 text-sm">
                  <span className="text-white/40">Already a member?</span>
                  <Link
                    href="/auth/login"
                    onClick={dismiss}
                    className="text-violet-400 hover:text-violet-300 font-bold transition-colors"
                  >
                    Sign in here
                  </Link>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
