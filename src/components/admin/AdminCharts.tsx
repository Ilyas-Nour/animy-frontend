'use client'
import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon, Activity } from 'lucide-react'

// Define the exact colors for the different statuses to match the platform's theme
const STATUS_COLORS: Record<string, string> = {
    COMPLETED: '#10b981', // Emerald 500
    WATCHING: '#3b82f6',  // Blue 500
    READING: '#3b82f6',   // Blue 500
    PLAN_TO_WATCH: '#8b5cf6', // Violet 500
    PLAN_TO_READ: '#8b5cf6', // Violet 500
    ON_HOLD: '#f59e0b',   // Amber 500
    DROPPED: '#ef4444',   // Red 500
}

interface AdminChartsProps {
    stats: {
        watchlistStats: Record<string, number>
        mangaStats: Record<string, number>
    } | null
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-md border border-border/50 p-3 rounded-lg shadow-xl">
                <p className="text-sm font-bold">{payload[0].name.replace(/_/g, ' ')}</p>
                <p className="text-sm font-black text-primary">
                    {payload[0].value.toLocaleString()} Users
                </p>
            </div>
        )
    }
    return null
}

export default function AdminCharts({ stats }: AdminChartsProps) {
    // Memoize the data formatting to prevent recalculations on re-renders
    const animeData = useMemo(() => {
        if (!stats?.watchlistStats) return []
        return Object.entries(stats.watchlistStats)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: key,
                value,
                color: STATUS_COLORS[key] || '#6b7280'
            }))
            .sort((a, b) => b.value - a.value)
    }, [stats?.watchlistStats])

    const mangaData = useMemo(() => {
        if (!stats?.mangaStats) return []
        return Object.entries(stats.mangaStats)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
                name: key.replace('_MANGA', ''),
                value,
                color: STATUS_COLORS[key.replace('_MANGA', '')] || '#6b7280'
            }))
            .sort((a, b) => b.value - a.value)
    }, [stats?.mangaStats])

    if (!stats) return null;

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Anime Engagement Chart */}
            <Card className="shadow-lg bg-card/40 backdrop-blur-xl overflow-hidden border-border/40 hover:border-primary/30 transition-colors">
                <CardHeader className="bg-muted/10 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 font-bold uppercase tracking-tight text-muted-foreground">
                        <PieChartIcon className="w-4 h-4 text-blue-500" />
                        Anime Engagement Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 h-[300px] flex items-center justify-center">
                    {animeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={animeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {animeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value.replace(/_/g, ' ')}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-muted-foreground opacity-50 flex flex-col items-center">
                            <Activity className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">Insufficient Data</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Manga Engagement Chart */}
            <Card className="shadow-lg bg-card/40 backdrop-blur-xl overflow-hidden border-border/40 hover:border-primary/30 transition-colors">
                <CardHeader className="bg-muted/10 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 font-bold uppercase tracking-tight text-muted-foreground">
                        <PieChartIcon className="w-4 h-4 text-green-500" />
                        Manga Engagement Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 h-[300px] flex items-center justify-center">
                    {mangaData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mangaData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {mangaData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value.replace(/_/g, ' ')}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-muted-foreground opacity-50 flex flex-col items-center">
                            <Activity className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">Insufficient Data</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
