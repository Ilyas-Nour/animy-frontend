'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { CharacterEdge } from '@/types/anime'

interface CharacterVoiceCardProps {
    edge: CharacterEdge
}

export function CharacterVoiceCard({ edge }: CharacterVoiceCardProps) {
    const { node: character, role, voiceActors } = edge
    const voiceActor = voiceActors?.[0] // Usually primary Japanese VA

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all h-[80px]"
        >
            {/* Character Info */}
            <div className="flex flex-1 min-w-0 pr-2">
                <div className="relative w-14 h-full shrink-0">
                    <Image
                        src={character.image.large}
                        alt={character.name.full}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="flex flex-col justify-center pl-3 overflow-hidden">
                    <h5 className="font-bold text-xs truncate leading-tight">
                        {character.name.full}
                    </h5>
                    <span className="text-[10px] text-muted-foreground font-medium">
                        {role}
                    </span>
                </div>
            </div>

            {/* Voice Actor Info */}
            {voiceActor && (
                <div className="flex flex-1 min-w-0 flex-row-reverse pl-2">
                    <div className="relative w-14 h-full shrink-0">
                        <Image
                            src={voiceActor.image.large}
                            alt={voiceActor.name.full}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-center pr-3 text-right overflow-hidden">
                        <h5 className="font-bold text-xs truncate leading-tight">
                            {voiceActor.name.full}
                        </h5>
                        <span className="text-[10px] text-muted-foreground font-medium">
                            Japanese
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
