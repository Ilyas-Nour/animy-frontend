'use client'

import { Instagram, Github, Linkedin, Music, MessageCircle, Facebook } from 'lucide-react'
import { User } from '@/types/auth'

interface SocialLinksProps {
    user: User
}

const socialPlatforms = [
    {
        key: 'instagram' as const,
        icon: Instagram,
        color: '#E4405F',
        label: 'Instagram'
    },
    {
        key: 'github' as const,
        icon: Github,
        color: '#333',
        label: 'GitHub'
    },
    {
        key: 'linkedin' as const,
        icon: Linkedin,
        color: '#0A66C2',
        label: 'LinkedIn'
    },
    {
        key: 'tiktok' as const,
        icon: Music,
        color: '#000',
        label: 'TikTok'
    },
    {
        key: 'whatsapp' as const,
        icon: MessageCircle,
        color: '#25D366',
        label: 'WhatsApp'
    },
    {
        key: 'facebook' as const,
        icon: Facebook,
        color: '#1877F2',
        label: 'Facebook'
    },
    {
        key: 'snapchat' as const,
        icon: MessageCircle,
        color: '#FFFC00',
        label: 'Snapchat'
    },
]

export function SocialLinks({ user }: SocialLinksProps) {
    const activeSocialLinks = socialPlatforms.filter(platform => user[platform.key])

    if (activeSocialLinks.length === 0) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-2">
            {activeSocialLinks.map(({ key, icon: Icon, color, label }) => {
                const url = user[key]
                if (!url) return null

                return (
                    <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200"
                        title={label}
                    >
                        <Icon
                            className="w-5 h-5 transition-transform group-hover:scale-110"
                            style={{ color }}
                        />
                    </a>
                )
            })}
        </div>
    )
}
