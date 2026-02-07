'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, ArrowRight, RefreshCcw, Mail, Sparkles, ShieldCheck, Ghost } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type VerificationStatus = 'loading' | 'success' | 'expired' | 'error'

function SoulResonance({ status }: { status: VerificationStatus }) {
    const colors = {
        loading: 'from-cyan-500 to-blue-600',
        success: 'from-emerald-400 to-cyan-500',
        expired: 'from-amber-400 to-orange-600',
        error: 'from-rose-500 to-red-600'
    }

    return (
        <div className="relative w-32 h-32 flex items-center justify-center mb-8 mx-auto">
            {/* Pulsing Rings */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [1, 1.5, 2],
                        opacity: [0.3, 0.1, 0]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 1,
                        ease: "easeOut"
                    }}
                    className={cn(
                        "absolute inset-0 rounded-full border-2 border-primary/20 bg-gradient-to-br opacity-20",
                        colors[status]
                    )}
                />
            ))}

            {/* Core Icon */}
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                    "relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl transition-all duration-700",
                    colors[status]
                )}
            >
                <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm" />
                {status === 'loading' && <Loader2 className="w-10 h-10 text-white animate-spin relative z-10" />}
                {status === 'success' && <ShieldCheck className="w-10 h-10 text-white relative z-10" />}
                {status === 'expired' && <Ghost className="w-10 h-10 text-white relative z-10" />}
                {status === 'error' && <XCircle className="w-10 h-10 text-white relative z-10" />}
            </motion.div>
        </div>
    )
}

function VerifyContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const router = useRouter()

    const [status, setStatus] = useState<VerificationStatus>('loading')
    const [message, setMessage] = useState('Synchronizing frequencies...')
    const [userEmail, setUserEmail] = useState('')

    // Resend Logic
    const [isResending, setIsResending] = useState(false)
    const [resendComplete, setResendComplete] = useState(false)

    const { login } = useAuth()
    const verifyCalled = useRef(false)

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('No frequency detected. The verification token is missing.')
            return
        }

        if (verifyCalled.current) return
        verifyCalled.current = true

        const verify = async () => {
            try {
                const response = await api.get(`/auth/verify?token=${token}`)
                setStatus('success')
                setMessage('Your existence has been authenticated. Welcome to the Nexus.')

                if (response.data.access_token && response.data.user) {
                    login(response.data.access_token, response.data.user)
                    // Redirect to discovery for first-time onboarding
                    setTimeout(() => router.push('/discovery'), 3000)
                } else {
                    setTimeout(() => router.push('/auth/login'), 3000)
                }
            } catch (err: any) {
                const data = err.response?.data
                if (data?.expired) {
                    setStatus('expired')
                    setMessage('The verification frequency has faded. Your link has expired.')
                    setUserEmail(data.email || '')
                } else {
                    setStatus('error')
                    setMessage(data?.message || 'A glitch in the simulation occurred. Please try again.')
                }
            }
        }

        verify()
    }, [token, router, login])

    const handleResend = async () => {
        if (!userEmail) return

        try {
            setIsResending(true)
            await api.post('/auth/resend-verification', { email: userEmail })
            setResendComplete(true)
            toast.success('Beacon lit!', { description: 'A new verification link is on its way.' })
        } catch (error: any) {
            toast.error('Refraction error', { description: error.response?.data?.message || 'Could not resend.' })
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Cinematic Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={cn(
                    "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] transition-all duration-1000",
                    status === 'success' ? 'bg-emerald-500/10' : status === 'expired' ? 'bg-amber-500/10' : 'bg-primary/10'
                )} />
                <div className={cn(
                    "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] transition-all duration-1000",
                    status === 'error' ? 'bg-rose-500/10' : 'bg-blue-600/10'
                )} />

                {/* Moving Particles */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                className="relative z-10 w-full max-w-xl"
            >
                <div className="backdrop-blur-3xl bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-12 shadow-2xl text-center relative overflow-hidden group">
                    {/* Interior Glow */}
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                    <SoulResonance status={status} />

                    <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl font-black text-white tracking-tighter">
                            {status === 'loading' && 'Resonating...'}
                            {status === 'success' && 'Authenticated'}
                            {status === 'expired' && 'Frequency Expired'}
                            {status === 'error' && 'Simulation Error'}
                        </h1>

                        <p className="text-white/50 text-xl font-medium leading-relaxed max-w-sm mx-auto italic">
                            &ldquo;{message}&rdquo;
                        </p>
                    </motion.div>

                    <div className="mt-12">
                        <AnimatePresence mode="wait">
                            {status === 'expired' ? (
                                <motion.div
                                    key="expired-action"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="space-y-6"
                                >
                                    {!resendComplete ? (
                                        <div className="space-y-4">
                                            <p className="text-white/30 text-sm font-bold uppercase tracking-widest">Restore the Frequency</p>
                                            <Button
                                                onClick={handleResend}
                                                disabled={isResending}
                                                className="w-full h-16 rounded-[1.25rem] bg-amber-500 hover:bg-amber-400 text-black font-black text-lg gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(245,158,11,0.2)]"
                                            >
                                                {isResending ? (
                                                    <Loader2 className="animate-spin w-6 h-6" />
                                                ) : (
                                                    <>
                                                        <RefreshCcw className="w-6 h-6" />
                                                        Relight the Beacon
                                                    </>
                                                )}
                                            </Button>
                                            {userEmail && (
                                                <p className="text-white/20 text-xs font-mono">
                                                    Will be sent to: {userEmail.replace(/(.{3}).*(@.*)/, "$1...$2")}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3"
                                        >
                                            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                                                <Sparkles className="w-5 h-5" />
                                                A new beacon has been lit.
                                            </div>
                                            <p className="text-white/40 text-sm">Check your data terminal (email) to continue the journey.</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="default-action">
                                    <Link href={status === 'success' ? '/discovery' : '/'}>
                                        <Button
                                            className={cn(
                                                "w-full h-16 rounded-[1.25rem] text-lg font-black tracking-widest uppercase gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl",
                                                status === 'success'
                                                    ? "bg-white text-black hover:bg-white/90 shadow-white/10"
                                                    : "bg-white/10 text-white hover:bg-white/15 border border-white/5"
                                            )}
                                        >
                                            {status === 'success' ? 'Discover your Spirit' : 'Back to Reality'}
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Progress Indicator */}
                    {status === 'loading' && (
                        <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className='min-h-screen bg-black flex items-center justify-center'>
                <div className="space-y-4 text-center">
                    <Loader2 className="animate-spin text-white/20 w-12 h-12 mx-auto" />
                    <p className="text-white/10 text-xs font-mono uppercase tracking-[0.3em]">Initialising Reality...</p>
                </div>
            </div>
        }>
            <VerifyContent />
        </Suspense>
    )
}

