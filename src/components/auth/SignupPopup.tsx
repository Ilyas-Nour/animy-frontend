'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mail, Lock, User, ArrowRight, Sparkles, Shield,
  Eye, EyeOff, CheckCircle2, Zap, Star, Users, BookOpen, Bell, Bookmark
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FaGoogle } from 'react-icons/fa'
import { authService } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AnimatedLogo } from '@/components/layout/AnimatedLogo'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase & number'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'At least 2 characters').optional().or(z.literal('')),
  lastName: z.string().min(2, 'At least 2 characters').optional().or(z.literal('')),
  username: z.string().min(3, 'At least 3 characters').optional().or(z.literal('')),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms & conditions' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

const benefits = [
  { icon: Bookmark, label: 'Track your watchlist', desc: 'Keep all your anime & manga organized' },
  { icon: Star, label: 'Personalized recommendations', desc: 'AI-curated picks just for you' },
  { icon: Users, label: 'Join the community', desc: 'Connect with 10,000+ fans worldwide' },
  { icon: Bell, label: 'Never miss a release', desc: 'Get alerts for new episodes & chapters' },
  { icon: BookOpen, label: 'Unlimited reading', desc: 'Access thousands of manga chapters' },
  { icon: Shield, label: '100% Free', desc: 'No credit card, no hidden fees, ever' },
]

interface SignupPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function SignupPopup({ isOpen, onClose }: SignupPopupProps) {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })
  const acceptedTerms = watch('acceptedTerms')

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true)
      setError(null)
      const { confirmPassword, acceptedTerms, ...registerData } = data
      await authService.register(registerData)
      setSuccess(true)
    } catch (err: any) {
      let msg = 'Registration failed. Please try again.'
      if (err.response?.data?.message) {
        const m = err.response.data.message
        msg = Array.isArray(m) ? m.join(', ') : String(m)
      }
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-5xl max-h-[90vh] flex rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(139,92,246,0.4)] border border-white/10">

              {/* LEFT — Anime Illustration + Benefits */}
              <div className="relative hidden lg:flex flex-col justify-end w-[45%] shrink-0 overflow-hidden">
                {/* Background image */}
                <Image
                  src="/anime-girl-bg.png"
                  alt="Join Animy"
                  fill
                  className="object-cover object-top"
                  priority
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-purple-400/60"
                    style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 20}%` }}
                    animate={{ y: [-10, 10, -10], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                  />
                ))}

                {/* Content at bottom */}
                <div className="relative z-10 p-8 space-y-5">
                  {/* Logo */}
                  <div className="mb-2">
                    <AnimatedLogo innerClassName="text-white" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-white leading-tight">
                      Your Anime Journey
                      <br />
                      <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Starts Here.
                      </span>
                    </h2>
                    <p className="text-white/60 text-sm mt-1">Join the ultimate anime community</p>
                  </div>

                  <div className="space-y-2.5">
                    {benefits.map((b, i) => (
                      <motion.div
                        key={b.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                        className="flex items-center gap-3"
                      >
                        <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                          <b.icon className="w-3.5 h-3.5 text-violet-300" />
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold leading-none">{b.label}</p>
                          <p className="text-white/50 text-[11px] mt-0.5">{b.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT — Sign Up Form */}
              <div className="flex-1 overflow-y-auto bg-[#0d0d1a] relative">
                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-7 pt-8">
                  {/* Mobile logo */}
                  <div className="lg:hidden mb-5">
                    <AnimatedLogo />
                  </div>

                  {!success ? (
                    <>
                      {/* Header */}
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
                          <Sparkles className="w-3 h-3" />
                          Create your free account
                        </div>
                        <h1 className="text-2xl font-black text-white">Join Animy</h1>
                        <p className="text-white/50 text-sm mt-1">Track, discover, and connect with anime fans.</p>
                      </div>

                      {/* Google button */}
                      <button
                        type="button"
                        onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google` }}
                        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium text-sm transition-all mb-5 group"
                      >
                        <FaGoogle className="w-4 h-4 text-red-400" />
                        Continue with Google
                      </button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-[#0d0d1a] px-3 text-white/40 text-xs">or sign up with email</span>
                        </div>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-white/70 text-xs mb-1 block">First Name</Label>
                            <Input
                              placeholder="John"
                              disabled={isLoading}
                              {...register('firstName')}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 h-10 text-sm rounded-xl"
                            />
                            {errors.firstName && <p className="text-red-400 text-[11px] mt-1">{errors.firstName.message}</p>}
                          </div>
                          <div>
                            <Label className="text-white/70 text-xs mb-1 block">Last Name</Label>
                            <Input
                              placeholder="Doe"
                              disabled={isLoading}
                              {...register('lastName')}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 h-10 text-sm rounded-xl"
                            />
                            {errors.lastName && <p className="text-red-400 text-[11px] mt-1">{errors.lastName.message}</p>}
                          </div>
                        </div>

                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Username (optional)</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                              placeholder="johndoe"
                              disabled={isLoading}
                              {...register('username')}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 h-10 text-sm rounded-xl pl-10"
                            />
                          </div>
                          {errors.username && <p className="text-red-400 text-[11px] mt-1">{errors.username.message}</p>}
                        </div>

                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Email Address *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              disabled={isLoading}
                              {...register('email')}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 h-10 text-sm rounded-xl pl-10"
                            />
                          </div>
                          {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              disabled={isLoading}
                              {...register('password')}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 h-10 text-sm rounded-xl pl-10 pr-10"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.password && <p className="text-red-400 text-[11px] mt-1">{errors.password.message}</p>}
                          <p className="text-white/30 text-[11px] mt-1">Must contain uppercase, lowercase & number</p>
                        </div>

                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Confirm Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              disabled={isLoading}
                              {...register('confirmPassword')}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 h-10 text-sm rounded-xl pl-10 pr-10"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.confirmPassword && <p className="text-red-400 text-[11px] mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <div className="flex items-start gap-2.5 pt-1">
                          <Checkbox
                            id="terms-popup"
                            checked={acceptedTerms}
                            onCheckedChange={(v) => setValue('acceptedTerms', v as any)}
                            className="mt-0.5 border-white/20 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                          />
                          <label htmlFor="terms-popup" className="text-xs text-white/50 leading-relaxed cursor-pointer">
                            I accept the{' '}
                            <Link href="/terms" className="text-violet-400 hover:text-violet-300">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-violet-400 hover:text-violet-300">Privacy Policy</Link>
                          </label>
                        </div>
                        {errors.acceptedTerms && <p className="text-red-400 text-[11px]">{errors.acceptedTerms.message}</p>}

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-xl text-xs">
                            {error}
                          </motion.div>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-11 rounded-xl font-bold text-sm text-white relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 via-violet-600 to-pink-600 hover:from-blue-500 hover:via-violet-500 hover:to-pink-500 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
                        >
                          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="relative flex items-center justify-center gap-2">
                            {isLoading ? (
                              <><span>Creating account</span><span className="animate-pulse">...</span></>
                            ) : (
                              <><Zap className="w-4 h-4" /><span>Create My Account</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                            )}
                          </span>
                        </button>
                      </form>

                      <p className="text-center text-white/40 text-xs mt-4">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 font-semibold" onClick={onClose}>
                          Sign in
                        </Link>
                      </p>
                    </>
                  ) : (
                    /* Success state */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-12 space-y-5"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                        className="relative"
                      >
                        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-green-400/10 animate-ping" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-black text-white">Check your email!</h2>
                        <p className="text-white/50 text-sm mt-2 max-w-xs mx-auto">
                          We&apos;ve sent a verification link to your inbox. Click it to activate your Animy account!
                        </p>
                      </div>
                      <button
                        onClick={() => { onClose(); router.push('/auth/login') }}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                      >
                        Go to Login
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
