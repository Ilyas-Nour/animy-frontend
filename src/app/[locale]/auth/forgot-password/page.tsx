'use client'
export const runtime = 'edge';

import { useState, useRef, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowRight, ArrowLeft, KeyRound, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { authService } from '@/lib/auth'
import { Turnstile } from '@marsidev/react-turnstile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const turnstileRef = useRef<any>(null)
  
  // Cooldown countdown for resending (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (!turnstileToken) {
      setError('Please click and complete the "Verify you are human" check.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await authService.forgotPassword(data.email.trim().toLowerCase(), turnstileToken)
      setSubmittedEmail(data.email.trim().toLowerCase())
      setResendCooldown(60)
      toast.success('Reset link dispatched! Please check your email inbox.')
    } catch (err: any) {
      turnstileRef.current?.reset?.()
      setTurnstileToken('')
      
      let msg = 'Failed to request password reset. Please try again.'
      if (err.response?.data?.message) {
        const m = err.response.data.message
        if (typeof m === 'string') msg = m
        else if (Array.isArray(m)) msg = m.join(', ')
        else if (typeof m === 'object' && m.message) msg = String(m.message)
      }
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!submittedEmail || resendCooldown > 0) return
    if (!turnstileToken) {
      setError('Please complete the security check to resend.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await authService.forgotPassword(submittedEmail, turnstileToken)
      setResendCooldown(60)
      toast.success('A new reset link has been sent to your email!')
    } catch (err: any) {
      turnstileRef.current?.reset?.()
      setTurnstileToken('')
      const msg = err.response?.data?.message || 'Failed to resend reset email.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Left Side (Branding & Guidance) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex flex-col justify-center space-y-6 p-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              Account Security
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-tight">
              Trouble Accessing
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Your Account?
              </span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              No problem! Enter your verified email address and we&apos;ll send you an encrypted, time-limited link to safely regain access to your anime watchlist and community profile.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 mt-0.5 border border-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Secure & Encrypted</h3>
                <p className="text-sm text-muted-foreground">Reset links are cryptographically signed and expire automatically after 1 hour.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 mt-0.5 border border-primary/20">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Instant Delivery</h3>
                <p className="text-sm text-muted-foreground">Transactional delivery ensures your recovery link arrives within seconds.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side (Interactive Card) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center"
        >
          <Card className="w-full shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
            
            <CardHeader className="space-y-2 pb-6 pt-6">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit group mb-1"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Back to sign in
              </Link>
              <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
              <CardDescription className="text-sm">
                {!submittedEmail
                  ? "Enter the email associated with your account to receive a reset link"
                  : "Check your inbox for further instructions"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {!submittedEmail ? (
                  <motion.form
                    key="request-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-11 bg-background/50"
                          disabled={isLoading}
                          autoFocus
                          {...register('email')}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium"
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Turnstile Security Check */}
                    <div className="cf-turnstile flex flex-col items-center justify-center gap-2 pt-1" data-action="turnstile-spin-v2">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey="0x4AAAAAAD8ZNK3FygnkC7vj"
                        options={{ action: "turnstile-spin-v2" }}
                        onSuccess={(token) => {
                          setTurnstileToken(token)
                          setError(null)
                        }}
                        onExpire={() => {
                          setTurnstileToken('')
                          turnstileRef.current?.reset?.()
                        }}
                        onError={() => {
                          setTurnstileToken('')
                          setError('Security verification failed. Please try again.')
                        }}
                      />
                      {!turnstileToken && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium animate-pulse">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                          Please click &quot;Verify you are human&quot; above to enable reset
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold group shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || !turnstileToken}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Sending instructions...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Send Reset Link
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 text-center py-2"
                  >
                    <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-25" />
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">Reset Link Dispatched</h3>
                      <p className="text-sm text-muted-foreground">
                        If an account exists for <span className="text-foreground font-semibold">{submittedEmail}</span>, we&apos;ve sent an email with instructions to reset your password.
                      </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs text-muted-foreground text-left space-y-1.5">
                      <p className="font-semibold text-foreground">Next Steps:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Check your spam or junk folder if you don&apos;t see the email within 2 minutes.</li>
                        <li>The reset link will remain valid for 60 minutes.</li>
                      </ul>
                    </div>

                    <div className="space-y-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 border-border/60 hover:bg-white/5"
                        onClick={handleResend}
                        disabled={isLoading || resendCooldown > 0 || !turnstileToken}
                      >
                        {resendCooldown > 0 ? (
                          `Resend link in ${resendCooldown}s`
                        ) : (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Resend Reset Email
                          </span>
                        )}
                      </Button>

                      <Link href="/auth/login" className="block w-full">
                        <Button className="w-full h-11 font-semibold">
                          Return to Sign In
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 pt-6 border-t border-border/40 text-center">
                <p className="text-sm text-muted-foreground">
                  Remembered your credentials?{' '}
                  <Link href="/auth/login" className="text-primary font-medium hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
