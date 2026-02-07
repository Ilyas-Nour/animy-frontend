'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Award, Activity, Lock, Users, Zap, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Anime } from '@/types/anime'
import { useAuth } from '@/context/AuthContext'

interface BentoGridProps {
    trending: Anime[]
}

export function BentoGrid({ trending }: BentoGridProps) {
    const { isAuthenticated, user } = useAuth()

    return (
        <section className="container py-24">
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">

                {/* Tile A: Large - Trending Anime Highlight */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-card border border-border shadow-2xl"
                >
                    <div className="absolute inset-0 z-0">
                        {trending[0] && (
                            <Image
                                src={trending[0].images.jpg.large_image_url}
                                alt="Trending"
                                fill
                                className="object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                loading="lazy"
                                decoding="async"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    </div>

                    <div className="relative z-10 h-full p-8 flex flex-col justify-end space-y-4">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter">
                            <TrendingUp size={20} />
                            <span>Curated Spotlight</span>
                        </div>
                        <h3 className="text-4xl font-black text-white dark:text-white drop-shadow-md">Your Next Obsession</h3>
                        <p className="text-muted-foreground text-lg max-w-sm">
                            Hand-picked series that are defining the current season.
                        </p>
                        <div className="pt-4 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {trending.slice(1, 5).map((anime) => (
                                <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`}>
                                    <div className="relative h-28 w-20 flex-shrink-0 rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-colors">
                                        <Image src={anime.images.jpg.image_url} alt={anime.title} fill className="object-cover" sizes="80px" loading="lazy" decoding="async" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Tile B: Medium - 'The Legend Begins' Stats Preview */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 md:row-span-1 relative bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-[2.5rem] border border-border p-8 flex flex-col justify-between group overflow-hidden shadow-xl"
                >
                    <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                        <Award size={120} strokeWidth={1} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <h4 className="text-2xl font-black uppercase tracking-tight">The Legend Begins</h4>
                        </div>

                        <div className="space-y-4">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Track your journey, earn <span className="text-primary font-bold">XP</span>, and ascend from <span className="text-foreground font-bold">Initiate</span> to <span className="text-foreground font-bold">Legend</span>.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                <span className="px-2 py-1 bg-primary/10 rounded text-primary">XP System</span>
                                <span className="px-2 py-1 bg-primary/10 rounded text-primary">Ranks</span>
                                <span className="px-2 py-1 bg-primary/10 rounded text-primary">Badges</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-4">
                        <Link href={isAuthenticated ? "/dashboard/profile" : "/auth/login"}>
                            <Button className="w-full h-11 rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90">
                                {isAuthenticated ? "View My Stats" : "Start Your Legend"}
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Tile C: Small - Community Pulse */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-1 md:row-span-1 bg-card backdrop-blur-xl rounded-[2.5rem] border border-border p-6 flex flex-col justify-between shadow-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={18} className="text-green-500" />
                            <span className="text-sm font-black uppercase tracking-widest">Live Pulse</span>
                        </div>
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-muted overflow-hidden">
                                    <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 42}`} alt="User" width={28} height={28} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 animate-pulse" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="text-foreground font-bold">@alex_kun</span> just favorited <span className="text-primary font-bold">Jujutsu Kaisen</span>
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-2 w-2 rounded-full bg-pink-500 mt-1.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="text-foreground font-bold">@mora</span> reached <span className="text-pink-500 font-bold">Level 10</span>
                            </p>
                        </div>
                    </div>

                    <Link href="/chat" className="pt-4">
                        <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest gap-2 bg-foreground/5 hover:bg-foreground/10">
                            <Users size={14} /> Join Discussion
                        </Button>
                    </Link>
                </motion.div>

                {/* Tile D: Small - 'Made With Love' or Extra Link */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-pink-500/10 dark:from-pink-500/20 to-orange-500/10 dark:to-orange-500/20 rounded-[2.5rem] border border-border p-6 flex flex-col justify-center items-center text-center space-y-3 group shadow-xl"
                >
                    <div className="relative">
                        <Heart size={40} className="text-pink-500 fill-pink-500/20 group-hover:scale-125 transition-transform duration-500" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full -z-10"
                        />
                    </div>
                    <p className="text-sm font-black text-foreground leading-tight">Elevate Your Lifestyle</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Hand-crafted for the Otaku soul</p>
                </motion.div>

            </div>
        </section>
    )
}
