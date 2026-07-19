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
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 md:p-6 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-[1100px] h-auto md:min-h-[600px] rounded-[32px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ─── Anime Background (Landscape Image) ──────────────── */}
              <div className="absolute inset-0 bg-[#0a0a14]">
                <Image
                  src="/all.jpg"
                  alt="Anime community"
                  fill
                  className="object-cover object-[70%_30%] scale-100"
                  priority
                />
                {/* 
                  Heavy dark gradient on the left half to ensure text is 100% readable.
                  Fades out smoothly to the right side where the characters are visible.
                */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#07070c] via-[#07070c]/90 to-transparent w-full md:w-[65%]" />
                
                {/* Subtle vignette around the edges of the whole modal */}
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
              </div>

              {/* ─── Close Button ─────────────────────────────────────────── */}
              <button
                onClick={dismiss}
                aria-label="Close"
                className="absolute top-6 right-6 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/80 border border-white/20 hover:border-white/40 text-white/70 hover:text-white transition-all duration-300 backdrop-blur-md"
              >
                <IoClose className="w-6 h-6" />
              </button>

              {/* ─── Content Container ────────────────────────────────────── */}
              <div className="relative z-10 flex flex-col justify-center h-full p-8 sm:p-10 md:p-14 md:w-[60%]">
                
                {/* Branding */}
                <div className="mb-8">
                  <AnimatedLogo innerClassName="text-white scale-125 origin-left" />
                </div>

                {/* Header section */}
                <div className="mb-8">
                  <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-white leading-[1.05] tracking-tight mb-4 drop-shadow-xl">
                    Join the{' '}
                    <span className="relative inline-block">
                      <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 blur-lg opacity-50"></span>
                      <span className="relative bg-gradient-to-r from-violet-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                        Animy
                      </span>
                    </span>
                    <br />
                    Universe
                  </h2>
                  <p className="text-white/70 text-lg leading-relaxed max-w-[420px] font-medium drop-shadow-md">
                    Your ultimate destination for anime & manga. Create your free account and unlock the full experience today.
                  </p>
                </div>

                {/* Benefits grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 max-w-[500px]">
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

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-4 max-w-[500px]">
                  {/* Primary CTA */}
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

                  {/* Google CTA */}
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

                {/* Footer */}
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
