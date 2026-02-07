'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen w-full bg-background relative overflow-hidden flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
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
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Privacy Policy</h1>
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
                                        <h2 className="text-2xl font-bold text-primary mb-4">1. Introduction</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            At Animy, accessible from animy.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Animy and how we use it.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">2. Information We Collect</h2>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            We collect several different types of information for various purposes to provide and improve our Service to you:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                            <li><strong>Personal Data:</strong> Email address, First name and last name (when you sign up).</li>
                                            <li><strong>Usage Data:</strong> We may also collect information how the Service is accessed and used. This Usage Data may include information such as your computer&apos;s Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</li>
                                        </ul>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">3. Use of Data</h2>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            Animy uses the collected data for various purposes:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                            <li>To provide and maintain the Service</li>
                                            <li>To notify you about changes to our Service</li>
                                            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                                            <li>To provide customer care and support</li>
                                            <li>To provide analysis or valuable information so that we can improve the Service</li>
                                            <li>To monitor the usage of the Service</li>
                                        </ul>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">4. Cookies</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service. For more detailed information, please visit our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">5. Third-Party Links</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party&apos;s site. We strongly advise you to review the Privacy Policy of every site you visit.
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
