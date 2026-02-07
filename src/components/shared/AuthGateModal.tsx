'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, ShieldCheck, Users, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'

interface AuthGateModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
}

export function AuthGateModal({ isOpen, onClose, title, description }: AuthGateModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-transparent border-none shadow-none">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-background/80 backdrop-blur-xl border border-border rounded-[2.5rem] overflow-hidden shadow-2xl dark:shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />

                    <div className="relative z-10 p-8 md:p-12 text-center space-y-8">
                        <div className="mx-auto h-20 w-20 bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                            <Lock className="h-10 w-10 text-white" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                {title || "Unlock Your Legend"}
                            </h2>
                            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                                {description || "Join the circle to track your journey, level up your profile, and share your favorite moments with friends."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-left">
                            {[
                                { icon: Zap, text: "Track your watch history & progress", color: "text-yellow-400" },
                                { icon: ShieldCheck, text: "Create your personal anime legacy", color: "text-green-400" },
                                { icon: Users, text: "Connect & chat with friends", color: "text-blue-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] dark:bg-white/5 border border-border group hover:bg-foreground/[0.05] dark:hover:bg-white/10 transition-colors">
                                    <item.icon className={`h-6 w-6 ${item.color}`} />
                                    <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-4 pt-4">
                            <Link href="/auth/register" onClick={onClose}>
                                <Button size="lg" className="w-full h-14 rounded-2xl text-xl font-black gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-xl group transition-all">
                                    Get Started Free
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/auth/login" onClick={onClose}>
                                <Button variant="ghost" className="w-full h-14 rounded-2xl text-lg font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
                                    Already have an account? Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    )
}
