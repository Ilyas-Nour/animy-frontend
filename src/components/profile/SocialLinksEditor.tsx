'use client'

import { useState } from 'react'
import { Instagram, Github, Linkedin, Music, MessageCircle, Facebook, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/api'

interface SocialLinksEditorProps {
    initialLinks: {
        instagram?: string
        github?: string
        linkedin?: string
        tiktok?: string
        whatsapp?: string
        facebook?: string
        snapchat?: string
    }
    onUpdate?: () => void
}

const socialPlatforms = [
    {
        key: 'instagram' as const,
        label: 'Instagram',
        icon: Instagram,
        placeholder: 'https://instagram.com/username',
        color: '#E4405F'
    },
    {
        key: 'github' as const,
        label: 'GitHub',
        icon: Github,
        placeholder: 'https://github.com/username',
        color: '#333'
    },
    {
        key: 'linkedin' as const,
        label: 'LinkedIn',
        icon: Linkedin,
        placeholder: 'https://linkedin.com/in/username',
        color: '#0A66C2'
    },
    {
        key: 'tiktok' as const,
        label: 'TikTok',
        icon: Music,
        placeholder: 'https://tiktok.com/@username',
        color: '#000'
    },
    {
        key: 'whatsapp' as const,
        label: 'WhatsApp',
        icon: MessageCircle,
        placeholder: 'https://wa.me/1234567890',
        color: '#25D366'
    },
    {
        key: 'facebook' as const,
        label: 'Facebook',
        icon: Facebook,
        placeholder: 'https://facebook.com/username',
        color: '#1877F2'
    },
    {
        key: 'snapchat' as const,
        label: 'Snapchat',
        icon: MessageCircle,
        placeholder: 'https://snapchat.com/add/username',
        color: '#FFFC00'
    },
]

export function SocialLinksEditor({ initialLinks, onUpdate }: SocialLinksEditorProps) {
    const [links, setLinks] = useState(initialLinks)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.patch('/users/profile', links)
            toast.success('Social links updated successfully!')
            onUpdate?.()
        } catch (error: any) {
            console.error('Failed to update social links:', error)
            // Extract error message safely
            let errorMessage = 'Failed to update social links'
            if (error.response?.data?.message) {
                const msg = error.response.data.message
                errorMessage = Array.isArray(msg) ? msg[0] : (typeof msg === 'string' ? msg : errorMessage)
            } else if (error.message) {
                errorMessage = error.message
            }
            toast.error(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Social Links</h3>
                <p className="text-sm text-white/60">Add your social media profiles to your account</p>
            </div>

            <div className="space-y-4">
                {socialPlatforms.map(({ key, label, icon: Icon, placeholder, color }) => (
                    <div key={key} className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <Icon className="w-4 h-4" style={{ color }} />
                            {label}
                        </label>
                        <Input
                            type="url"
                            value={links[key] || ''}
                            onChange={(e) => setLinks({ ...links, [key]: e.target.value || undefined })}
                            placeholder={placeholder}
                            className="bg-white/[0.02] border-white/10 focus:border-indigo-500/50"
                        />
                    </div>
                ))}
            </div>

            <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Social Links'}
            </Button>
        </div>
    )
}
