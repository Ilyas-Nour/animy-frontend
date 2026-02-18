'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Relation } from '@/types/anime'
import { Badge } from '@/components/ui/badge'

interface RelationCardProps {
    relation: Relation
}

export function RelationCard({ relation }: RelationCardProps) {
    const { node, relationType } = relation

    return (
        <Link href={`/anime/${node.id}`}>
            <motion.div
                whileHover={{ y: -4 }}
                className="group relative flex gap-5 bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all p-3"
            >
                <div className="relative w-24 h-36 shrink-0 rounded-xl overflow-hidden border border-white/5 shadow-lg">
                    <Image
                        src={node.coverImage.large}
                        alt={node.title.romaji}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                </div>
                <div className="flex flex-col justify-center gap-2 overflow-hidden">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                        {relationType?.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-bold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {node.title.english || node.title.romaji}
                    </h4>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs px-2 py-0 border-white/10">
                            {node.format}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium uppercase">
                            {node.status?.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}
