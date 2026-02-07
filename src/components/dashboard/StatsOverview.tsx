'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { PlayCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface StatsOverviewProps {
    stats: any;
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#f97316'];

export function StatsOverview({ stats }: StatsOverviewProps) {
    if (!stats) return null

    // Data for Charts
    const animeData = [
        { name: 'Watching', value: stats.watching || 0 },
        { name: 'Completed', value: stats.completed || 0 },
        { name: 'Plan to Watch', value: stats.planToWatch || 0 },
        { name: 'Dropped', value: stats.dropped || 0 },
        { name: 'On Hold', value: stats.onHold || 0 },
    ].filter(d => d.value > 0);

    const mangaData = [
        { name: 'Reading', value: stats.reading || 0 },
        { name: 'Completed', value: stats.completedManga || 0 },
        { name: 'Plan to Read', value: stats.planToRead || 0 },
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Anime Distribution Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1"
            >
                <Card className="h-full bg-card/40 backdrop-blur-sm border-white/5">
                    <CardHeader>
                        <CardTitle>Anime Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] relative">
                        {animeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={animeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {animeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No data yet
                            </div>
                        )}
                        {/* Center Stat */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-3xl font-black">{stats.totalWatchlist || 0}</span>
                                <p className="text-xs uppercase text-muted-foreground font-bold">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Link href="/dashboard/watching">
                    <Card className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer hover:scale-[1.02]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <PlayCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium text-sm">Watching Now</p>
                                <p className="text-3xl font-black text-blue-500">{stats.watching || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/completed">
                    <Card className="bg-green-500/10 border-green-500/20 hover:bg-green-500/20 transition-all cursor-pointer hover:scale-[1.02]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium text-sm">Completed</p>
                                <p className="text-3xl font-black text-green-500">{stats.completed || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/plan-to-watch">
                    <Card className="bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20 transition-all cursor-pointer hover:scale-[1.02]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-muted-foreground font-medium text-sm">Plan to Watch</p>
                                <p className="text-3xl font-black text-yellow-500">{stats.planToWatch || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Manga Mini Chart */}
                <Link href="/dashboard/manga-shelf" className="block cursor-pointer">
                    <Card className="bg-card/40 border-white/5 hover:bg-card/60 transition-all hover:scale-[1.02]">
                        <CardContent className="p-4 h-full flex flex-col justify-center">
                            <p className="text-sm text-muted-foreground font-bold mb-2">Manga Progress</p>
                            <div className="h-[60px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mangaData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" hide />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#000', border: 'none' }} />
                                        <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
