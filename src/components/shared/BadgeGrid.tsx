'use client'

import React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BadgeItem {
    id: string
    code: string
    name: string
    description: string
    imageUrl: string
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
    unlockedAt: string
}

interface BadgeGridProps {
    badges: BadgeItem[]
    className?: string
}

export function BadgeGrid({ badges, className }: BadgeGridProps) {
    if (!badges || badges.length === 0) return null

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'LEGENDARY': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/20'
            case 'EPIC': return 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/20'
            case 'RARE': return 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/20'
            default: return 'text-green-500 bg-green-500/10 border-green-500/20 shadow-green-500/20'
        }
    }

    return (
        <section className={cn("space-y-6", className)}>
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                <span className="text-3xl">🏅</span> Achievements
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {badges.map((badge) => (
                    <Card key={badge.id} className={cn(
                        "border backdrop-blur-sm overflow-hidden group hover:scale-[1.02] transition-all duration-300",
                        getRarityColor(badge.rarity).split(' ')[2] // Accessing the border class somewhat hackily or just use base border
                    )}>
                        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                            <div className={cn(
                                "h-16 w-16 rounded-full flex items-center justify-center p-3 text-3xl shadow-lg mb-2",
                                getRarityColor(badge.rarity)
                            )}>
                                {/* Placeholder Emoji until real icons are mapped or imageUrl is used */}
                                🏆
                            </div>
                            <div>
                                <h3 className="font-bold leading-tight">{badge.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {badge.description}
                                </p>
                            </div>
                            <Badge variant="secondary" className="mt-auto text-[10px] uppercase tracking-wider font-extrabold opacity-70">
                                {badge.rarity}
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
