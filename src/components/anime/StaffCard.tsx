'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Staff } from '@/types/anime'
import Link from 'next/link'

interface StaffCardProps {
    staff: Staff
}

export function StaffCard({ staff }: StaffCardProps) {
    const { node, role } = staff

    return (
        <Link 
            href={`/person/${node.id}`}
            className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all h-[80px] group"
        >
            <div className="relative w-14 h-full shrink-0">
                <Image
                    src={node.image.large}
                    alt={node.name.full}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="flex flex-col justify-center pl-3 overflow-hidden">
                <h5 className="font-bold text-xs truncate leading-tight group-hover:text-primary transition-colors">
                    {node.name.full}
                </h5>
                <span className="text-[10px] text-muted-foreground font-medium truncate pr-2">
                    {role}
                </span>
            </div>
        </Link>
    )
}
