'use client'
export const runtime = 'edge';
import React from 'react'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function DMCAPage() {
    return (
        <div className="min-h-screen w-full bg-background relative overflow-hidden flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px]" />
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
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">DMCA Policy</h1>
                    <p className="text-muted-foreground text-lg">Digital Millennium Copyright Act</p>
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
                                        <h2 className="text-2xl font-bold text-primary mb-4">1. Non-Hosting Disclaimer</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Animy operates strictly as an indexing and search tool (similar to Google or Bing). <strong>We do not host, store, upload, or broadcast any video, media, or copyrighted files on our servers.</strong> All content is served directly from third-party hosting providers and APIs (such as AniList, Jikan, and various streaming hosters) that are completely independent of Animy.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">2. Safe Harbor</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Under the Digital Millennium Copyright Act (DMCA), Animy qualifies as a Service Provider. As an indexer, we are protected by the safe harbor provisions of the DMCA. We respect the intellectual property rights of others and expect our users to do the same.
                                        </p>
                                    </section>

                                    <hr className="border-white/5" />

                                    <section>
                                        <h2 className="text-2xl font-bold text-primary mb-4">3. Takedown Requests</h2>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            If you believe that your copyrighted work has been indexed by Animy in a way that constitutes copyright infringement, please note that <strong>we cannot remove content from third-party servers</strong>. However, we can remove the indexed link from our site.
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            To request the removal of a link, please send a formal DMCA takedown notice to <strong>support@animy.xyz</strong> containing the following:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                            <li>Identification of the copyrighted work you claim has been infringed.</li>
                                            <li>The exact URL(s) on Animy where the link to the infringing material is located.</li>
                                            <li>Your contact information (name, address, email).</li>
                                            <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner.</li>
                                            <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.</li>
                                        </ul>
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
