'use client'
export const runtime = 'edge';

import { useState, useRef, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowRight, ArrowLeft, KeyRound, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const turnstileRef = useRef<any>(null)

  // Token validation state
  const [isTokenValidating, setIsTokenValidating] = useState(true)
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setTokenError('No password reset token was found in your link. Please request a new link.')
      setIsTokenValidating(false)
      return
    }

    // Verify token validity on load
    authService
      .verifyResetToken(token)
      .then(() => {
        setIsTokenValidating(false)
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'This reset link is invalid or has expired.'
        setTokenError(msg)
        setIsTokenValidating(false)
      })
  }, [token])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const currentPassword = watch('password') || ''

  // Real-time strength checks
  const hasMinLength = currentPassword.length >= 8
  const hasUpper = /[A-Z]/.test(currentPassword)
  const hasLower = /[a-z]/.test(currentPassword)
  const hasNumber = /\d/.test(currentPassword)

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Missing reset token.')
      return
    }

    if (!turnstileToken) {
      setError('Please click and complete the "Verify you are human" check.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await authService.resetPassword({
        token,
        password: data.password,
        'cf-turnstile-response': turnstileToken,
      })
      setIsSuccess(true)
      toast.success('Your password has been successfully reset!')
    } catch (err: any) {
      turnstileRef.current?.reset?.()
      setTurnstileToken('')

      let msg = 'Failed to reset password. Please try again.'
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

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Left Side (Branding & Advice) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex flex-col justify-center space-y-6 p-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              Credentials Update
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-tight">
              Create a Strong
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                New Password
              </span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Choose a strong, unique password to secure your personal watchlist, manga reading progress, and account badges.
            </p>
          </div>

          <div className="space-y-3 pt-4 bg-card/40 border border-border/40 p-5 rounded-2xl">
            <h4 className="text-sm font-semibold text-foreground">Password Best Practices:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${hasMinLength ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                8+ Characters
              </div>
              <div className={`flex items-center gap-2 ${hasUpper ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${hasUpper ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                Uppercase Letter
              </div>
              <div className={`flex items-center gap-2 ${hasLower ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${hasLower ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                Lowercase Letter
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}>
                <div className={`w-2 h-2 rounded-full ${hasNumber ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                At least 1 Number
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side (Card Form) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center"
        >
          <Card className="w-full shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

            <CardHeader className="space-y-2 pb-6 pt-6">
              <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
              <CardDescription className="text-sm">
                Enter and confirm your new password below
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isTokenValidating ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm font-medium">Verifying reset token...</p>
                </div>
              ) : tokenError ? (
                <div className="py-6 space-y-5 text-center">
                  <div className="mx-auto w-14 h-14 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Invalid Reset Link</h3>
                    <p className="text-sm text-muted-foreground px-4">{tokenError}</p>
                  </div>
                  <div className="pt-2">
                    <Link href="/auth/forgot-password" className="block w-full">
                      <Button className="w-full h-11 font-semibold">
                        Request a New Reset Link
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center py-4"
                >
                  <div className="mx-auto w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-25" />
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Password Reset Complete!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your password has been successfully updated. You can now use your new credentials to sign in.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => router.push('/auth/login')}
                      className="w-full h-11 font-semibold group shadow-lg shadow-primary/25"
                    >
                      Sign In Now
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 bg-background/50"
                        disabled={isLoading}
                        autoFocus
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 bg-background/50"
                        disabled={isLoading}
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
                      onSuccess={(tok) => {
                        setTurnstileToken(tok)
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
                        Please click &quot;Verify you are human&quot; above to reset password
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
                        Updating password...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Reset Password
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-border/40 text-center">
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
