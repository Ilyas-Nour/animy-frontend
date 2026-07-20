'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Settings, Save, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface GlobalSettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
    const [settings, setSettings] = useState<Record<string, any>>({
        MAINTENANCE_MODE: false,
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
                MAINTENANCE_MODE: res.data?.MAINTENANCE_MODE === true || res.data?.MAINTENANCE_MODE === 'true'
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
                        <div className="flex items-center justify-between space-x-4 rounded-xl border border-border/40 bg-muted/20 p-4">
                            <div className="space-y-1">
                                <Label className="flex items-center gap-2 text-base font-bold text-red-500">
                                    <AlertCircle className="w-4 h-4" />
                                    Maintenance Mode
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    When enabled, normal users will see a maintenance page. Admins can still access the site.
                                </p>
                            </div>
                            <Switch
                                checked={settings.MAINTENANCE_MODE}
                                onCheckedChange={(checked) => setSettings({ ...settings, MAINTENANCE_MODE: checked })}
                                className="data-[state=checked]:bg-red-500"
                            />
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
