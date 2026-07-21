'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Settings, Save, AlertCircle, Megaphone, UserPlus, PlayCircle } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface GlobalSettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
    const [settings, setSettings] = useState<Record<string, any>>({
        MAINTENANCE_MODE: false,
        ENABLE_REGISTRATION: true,
        ANNOUNCEMENT_BANNER: '',
        FEATURED_ANIME_ID: '',
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchSettings()
        }
    }, [isOpen])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/settings')
            setSettings({
                MAINTENANCE_MODE: res.data?.MAINTENANCE_MODE === true || res.data?.MAINTENANCE_MODE === 'true',
                ENABLE_REGISTRATION: res.data?.ENABLE_REGISTRATION !== false && res.data?.ENABLE_REGISTRATION !== 'false',
                ANNOUNCEMENT_BANNER: res.data?.ANNOUNCEMENT_BANNER || '',
                FEATURED_ANIME_ID: res.data?.FEATURED_ANIME_ID || '',
            })
        } catch (error) {
            console.error('Failed to fetch settings', error)
            toast.error('Failed to load system settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put('/admin/settings', settings)
            toast.success('Settings updated successfully')
            onClose()
        } catch (error) {
            console.error('Failed to update settings', error)
            toast.error('Failed to update settings')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md border-border/40 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="w-5 h-5 text-primary" />
                        Global Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage system-wide configuration and operational states.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Maintenance Mode */}
                        <div className="flex items-center justify-between space-x-4 rounded-xl border border-border/40 bg-muted/20 p-4">
                            <div className="space-y-1">
                                <Label className="flex items-center gap-2 text-base font-bold text-red-500">
                                    <AlertCircle className="w-4 h-4" />
                                    Maintenance Mode
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    When enabled, normal users will see a maintenance page.
                                </p>
                            </div>
                            <Switch
                                checked={settings.MAINTENANCE_MODE}
                                onCheckedChange={(checked) => setSettings({ ...settings, MAINTENANCE_MODE: checked })}
                                className="data-[state=checked]:bg-red-500"
                            />
                        </div>

                        {/* Enable Registration */}
                        <div className="flex items-center justify-between space-x-4 rounded-xl border border-border/40 bg-muted/20 p-4">
                            <div className="space-y-1">
                                <Label className="flex items-center gap-2 text-base font-bold">
                                    <UserPlus className="w-4 h-4 text-primary" />
                                    Allow New Registrations
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Toggle this off to prevent new users from signing up.
                                </p>
                            </div>
                            <Switch
                                checked={settings.ENABLE_REGISTRATION}
                                onCheckedChange={(checked) => setSettings({ ...settings, ENABLE_REGISTRATION: checked })}
                            />
                        </div>

                        {/* Announcement Banner */}
                        <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-4">
                            <Label className="flex items-center gap-2 text-base font-bold">
                                <Megaphone className="w-4 h-4 text-yellow-500" />
                                Global Announcement Banner
                            </Label>
                            <input 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="E.g., Welcome to the new V2 update!" 
                                value={settings.ANNOUNCEMENT_BANNER}
                                onChange={(e) => setSettings({ ...settings, ANNOUNCEMENT_BANNER: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty to hide the banner from the top of the site.</p>
                        </div>

                        {/* Featured Hero Anime */}
                        <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-4">
                            <Label className="flex items-center gap-2 text-base font-bold">
                                <PlayCircle className="w-4 h-4 text-purple-500" />
                                Featured Hero Anime ID
                            </Label>
                            <input 
                                type="number"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="E.g., 21 (One Piece ID)" 
                                value={settings.FEATURED_ANIME_ID}
                                onChange={(e) => setSettings({ ...settings, FEATURED_ANIME_ID: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Enter the ID of the anime you want to feature heavily on the homepage.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
                        {saving ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
