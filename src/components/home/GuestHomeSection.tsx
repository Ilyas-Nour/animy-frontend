'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Zap, PlayCircle, Star, Sparkles, Rocket, Ghost } from 'lucide-react'

export function GuestHomeSection() {
    return (
        <section className="container py-12 md:py-24 relative">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none opacity-40" />

            <div className="relative group overflow-hidden rounded-[2.5rem] md:rounded-[4rem] border border-border/50 shadow-2xl bg-card/30 backdrop-blur-xl">

                {/* Cinematic Background Layer */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
                        className="w-full h-full relative"
                    >
                        <Image
                            src="https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2070&auto=format&fit=crop" // High density cinematic art
                            alt="Cinematic Background"
                            fill
                            className="object-cover opacity-50 md:opacity-40 grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"
                            priority
                        />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent dark:from-background dark:via-background/80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 md:p-20 items-center">

                    {/* Left: Compelling CTA */}
                    <div className="space-y-10 md:space-y-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-2xl"
                        >
                            <Sparkles size={16} className="text-primary animate-pulse" />
                            <span className="text-[10px] md:text-xs font-black text-primary tracking-[0.2em] uppercase">Gateway to Multi-World Data</span>
                        </motion.div>

                        <div className="space-y-4 md:space-y-6">
                            <motion.h2
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-8xl font-black italic tracking-tighter text-foreground leading-[0.85] uppercase"
                            >
                                START YOUR <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-indigo-600 drop-shadow-sm">JOURNEY</span>.
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="text-base md:text-xl text-muted-foreground font-medium max-w-lg leading-relaxed"
                            >
                                Step into the ultimate anime interface. Track every episode, engage with the community, and ascend from <b>Initiate</b> to <b>Immortal</b>.
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-5"
                        >
                            <Link href="/auth/register">
                                <Button size="lg" className="h-14 md:h-16 px-8 md:px-12 text-base md:text-lg font-black uppercase tracking-[0.1em] rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 transform hover:scale-105 active:scale-95 transition-all">
                                    <Rocket size={20} className="mr-2" />
                                    Launch Interface
                                </Button>
                            </Link>
                            <Link href="/auth/login">
                                <Button size="lg" variant="outline" className="h-14 md:h-16 px-8 md:px-12 text-base md:text-lg font-black uppercase tracking-[0.1em] rounded-2xl border-border/50 bg-background/5 hover:bg-accent backdrop-blur-xl text-foreground transform hover:scale-105 active:scale-95 transition-all">
                                    Continue Signal
                                </Button>
                            </Link>
                        </motion.div>

                        <div className="flex items-center gap-8 pt-6">
                            {[
                                { icon: Ghost, text: 'XP System', color: 'text-purple-500' },
                                { icon: Star, text: 'Custom Lists', color: 'text-yellow-500' },
                                { icon: PlayCircle, text: 'Global Feed', color: 'text-primary' }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center md:items-start gap-1">
                                    <item.icon size={24} className={item.color} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Premium Interactive Cards */}
                    <div className="relative h-full hidden lg:block">
                        <div className="grid grid-cols-2 gap-6 rotate-[-5deg] scale-110">

                            {/* Feature Card 1 */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="col-span-2 p-8 rounded-[2rem] bg-background/40 backdrop-blur-2xl border border-white/10 shadow-3xl space-y-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                        <Zap className="text-primary" size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-foreground italic">LEVEL ASCENSION</h4>
                                        <p className="text-sm text-muted-foreground font-bold">Earn data shards for every interaction</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                                        <span>Rank: Initiate</span>
                                        <span>75% to Novice</span>
                                    </div>
                                    <div className="h-3 w-full bg-accent/30 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '75%' }}
                                            transition={{ duration: 1.5, delay: 0.8 }}
                                            className="h-full bg-gradient-to-r from-primary via-purple-500 to-indigo-600"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Stat Card 2 */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 }}
                                className="p-8 rounded-[2rem] bg-background/40 backdrop-blur-2xl border border-white/10 flex flex-col items-center justify-center gap-3 text-center group/card hover:bg-primary/5 transition-colors"
                            >
                                <Users size={40} className="text-indigo-500 group-hover/card:scale-110 transition-transform" />
                                <h5 className="text-sm font-black italic uppercase">Social Sync</h5>
                            </motion.div>

                            {/* Stat Card 3 */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                                className="p-8 rounded-[2rem] bg-background/40 backdrop-blur-2xl border border-white/10 flex flex-col items-center justify-center gap-3 text-center group/card hover:bg-yellow-500/5 transition-colors"
                            >
                                <Star size={40} className="text-yellow-500 fill-yellow-500 group-hover/card:scale-110 transition-transform" />
                                <h5 className="text-sm font-black italic uppercase">Top Tier Rank</h5>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
