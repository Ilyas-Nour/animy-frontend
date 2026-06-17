'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function TermsPage() {
    return (
        <div className="min-h-screen w-full bg-background relative overflow-hidden flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="container max-w-4xl relative z-10 mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground text-lg">Last updated: {new Date().toLocaleDateString()}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
                        <CardContent className="p-0">
                            <ScrollArea className="h-[60vh] md:h-[70vh] w-full rounded-md p-6 md:p-10">
                                <div className="prose prose-invert max-w-none space-y-8">
                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">1. Acceptance of Terms</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            By accessing and using Animy (the &ldquo;Service&rdquo;), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services. Any participation in this service will constitute acceptance of this agreement. If you do not agree to abide by the above, please do not use this service.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">2. Description of Service</h2>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            Animy is a platform designed for discovering, tracking, and discussing anime and manga.
                                        </p>
                                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg">
                                            <p className="text-sm text-foreground/80 font-medium">
                                                <strong>Disclaimer:</strong> Animy does not host any copyrighted video content on its servers. All video content is provided by non-affiliated third parties. We do not control or claim ownership of such content.
                                            </p>
                                        </div>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">3. User Account</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer, and you agree to accept responsibility for all activities that occur under your account or password.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">4. Intellectual Property</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            The Service and its original content, features, and functionality are and will remain the exclusive property of Animy and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Animy.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">5. Termination</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">6. Contact Us</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            If you have any questions about these Terms, please contact us at <a href="mailto:support@animy.com" className="text-primary hover:underline">support@animy.com</a>.
                                        </p>
                                    </section>
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
