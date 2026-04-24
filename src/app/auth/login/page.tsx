'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff, Rocket } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/lib/api'
import { authService } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // State for Verification Modal
  const [needsVerification, setNeedsVerification] = useState(false)
  const [emailForVerification, setEmailForVerification] = useState('')

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true)
      setError(null)
      // Don't reset verification state here immediately to avoid flickering if it fails again
      const response = await authService.login(data)
      login(response.access_token, response.user)

      // If no interests selected, first time login -> Discovery
      if (!response.user.interests || response.user.interests.length === 0) {
        router.push('/discovery')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      let msg = 'Login failed.'
      if (err.response?.data?.message) {
        const m = err.response.data.message
        if (typeof m === 'object' && m !== null && 'message' in m) {
          msg = String(m.message)
        } else if (Array.isArray(m)) {
          msg = m.join(', ')
        } else if (typeof m === 'object') {
          msg = JSON.stringify(m)
        } else {
          msg = String(m)
        }
      }

      setError(msg)

      // Check for verification error
      if (msg.toLowerCase().includes('email not verified')) {
        setNeedsVerification(true) // Open Modal
        setEmailForVerification(data.email)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!emailForVerification) return
    try {
      setIsLoading(true)
      await api.post('/auth/resend-verification', { email: emailForVerification })
      setError(null) // Clear error
      setNeedsVerification(false) // Close modal
      // Optionally show success toast or message. using alert for now as rudimentary feedback or just close it.
      // Better: we can change the modal state to "Sent!" but closing is fine for now as per user request "show window... button".
      // Let's add a temporary success message to the error field to give feedback on main form or rely on email arrival.
      alert(`Verification email sent to ${emailForVerification}. Check your inbox!`)

    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to resend verification email.'
      // Keep modal open but show error inside it? Or just alert.
      alert(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Left Side (Branding) - unchanged */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:flex flex-col justify-center space-y-6 p-8"
        >
          {/* ... (Branding Content kept same) ... */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Welcome Back
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Continue Your
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Anime Journey
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Access your personalized watchlist, favorite anime, and discover new series tailored just for you.
            </p>
          </div>
          {/* ... Features list ... */}
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center"
        >
          <Card className="w-full shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(onSubmit)(e);
                }}
                className="space-y-5"
              >
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11"
                      disabled={isLoading}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="#"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                      disabled={isLoading}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">Signing in</span>
                      <span className="animate-pulse">...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              {/* ... Footer links ... */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="text-primary font-medium hover:underline"
                  >
                    Create account
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  By signing in, you agree to our{' '}
                  <Link href="#" className="underline hover:text-primary">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="#" className="underline hover:text-primary">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Verification Modal */}
      <Dialog
        open={needsVerification}
        onOpenChange={(open) => {
          // Prevent auto-closing if still needed, but allow closing via X button if desired?
          // For now, allow closing manually, but we added manual preventDefault on form to stop reload.
          setNeedsVerification(open)
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside to ensure they see the message
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">Verify your Email</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              You need to verify your email address <strong>{emailForVerification}</strong> before you can log in.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Did you lose the email? We can send you a new one.
            </p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={handleResendVerification}
              className="w-full sm:w-auto min-w-[200px] h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
              {!isLoading && <Rocket className="ml-2 h-4 w-4" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}