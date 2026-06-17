'use client'

export const runtime = 'edge';

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ChevronLeft,
    User as UserIcon,
    Mail,
    Shield,
    Calendar,
    Save,
    Trash2,
    ShieldAlert,
    Clock,
    Award,
    Activity
} from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getAvatarUrl, cn } from '@/lib/utils'
import Image from 'next/image'
import UserAvatar from '@/components/common/UserAvatar'
import { toast } from 'sonner'

export default function AdminUserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        bio: '',
        role: ''
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get(`/admin/users/${id}`)
                const data = res.data?.data || res.data
                setUser(data)
                setFormData({
                    username: data.username || '',
                    email: data.email || '',
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    bio: data.bio || '',
                    role: data.role || ''
                })
            } catch (error) {
                console.error('Failed to fetch user', error)
                toast.error('Failed to load user details')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [id])

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.put(`/admin/users/${id}`, formData)
            toast.success('User updated successfully')
            setUser({ ...user, ...formData })
        } catch (error) {
            console.error('Failed to update user', error)
            toast.error('Failed to update user')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this user account?')) return
        try {
            await api.delete(`/admin/users/${id}`)
            toast.success('User deleted successfully')
            router.push('/admin/users')
        } catch (error) {
            console.error('Failed to delete user', error)
            toast.error('Failed to delete user')
        }
    }

    if (loading) {
        return (
            <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-full" />
                <div className="h-6 w-48 bg-muted rounded" />
                <p className="text-muted-foreground">Loading administrative interface...</p>
            </div>
        )
    }

    if (!user) return <div className="p-20 text-center">User not found.</div>

    return (
        <div className="space-y-8 pb-20 px-4 sm:px-0">
            <div className="flex items-center gap-3 sm:gap-4">
                <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 sm:w-10 sm:h-10" onClick={() => router.back()}>
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black">Admin <span className="text-primary italic">User Control</span></h1>
                    <p className="text-muted-foreground font-medium uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3 text-red-500" /> Administrative Access
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* User Bio/Stats Card */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden shadow-xl bg-card border-border">
                        <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-purple-600">
                            <div className="absolute inset-0 bg-black/20" />
                        </div>
                        <CardContent className="relative pt-0 px-6 pb-6">
                            <div className="flex justify-center -translate-y-12">
                                <UserAvatar user={user} size="2xl" className="ring-4 ring-background shadow-2xl" />
                            </div>
                            <div className="text-center -mt-8 space-y-2">
                                <h3 className="text-xl font-black">{user.firstName} {user.lastName}</h3>
                                <p className="text-sm text-muted-foreground opacity-70">@{user.username}</p>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="font-black text-[10px] uppercase">
                                        {user.role}
                                    </Badge>
                                    {user.emailVerified ? (
                                        <Badge className="bg-green-500/10 text-green-500 border-none font-bold text-[10px]">VERIFIED</Badge>
                                    ) : (
                                        <Badge className="bg-orange-500/10 text-orange-500 border-none font-bold text-[10px]">PENDING</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-border/50 mt-6">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase text-muted-foreground opacity-50">
                                        <Award className="w-3 h-3" /> Level
                                    </div>
                                    <p className="text-lg font-black">{user.level}</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase text-muted-foreground opacity-50">
                                        <Activity className="w-3 h-3" /> XP
                                    </div>
                                    <p className="text-lg font-black">{user.xp.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md bg-muted/30 border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-50">System Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground opacity-60" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase opacity-40 leading-none">Registered</span>
                                    <span className="text-xs font-bold">{new Date(user.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-muted-foreground opacity-60" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase opacity-40 leading-none">Last ID</span>
                                    <span className="text-[10px] font-mono opacity-60 truncate max-w-[150px]">{user.id}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        variant="destructive"
                        className="w-full gap-2 font-bold shadow-lg shadow-destructive/10 rounded-xl"
                        onClick={handleDelete}
                    >
                        <Trash2 className="w-4 h-4" /> Terminate Account
                    </Button>
                </div>

                {/* Edit Form */}
                <Card className="lg:col-span-8 shadow-xl bg-card border-border overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-primary" />
                            Account Information
                        </CardTitle>
                        <CardDescription>Edit user data securely as an administrator.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="rounded-xl bg-background/50 focus:bg-background transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="rounded-xl bg-background/50 focus:bg-background transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</label>
                                <Input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="rounded-xl bg-background/50 focus:bg-background transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</label>
                                <Input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="rounded-xl bg-background/50 focus:bg-background transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Biography</label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="rounded-xl min-h-[120px] bg-background/50 focus:bg-background transition-all"
                                placeholder="Describe the user..."
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Administrative Role</label>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant={formData.role === 'ADMIN' ? 'default' : 'outline'}
                                    className={cn("rounded-xl font-bold h-12 gap-2", formData.role === 'ADMIN' && "shadow-lg shadow-primary/20")}
                                    onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                                >
                                    <Shield className="w-4 h-4" /> Administrator
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.role === 'USER' ? 'default' : 'outline'}
                                    className={cn("rounded-xl font-bold h-12 gap-2", formData.role === 'USER' && "shadow-lg shadow-primary/20")}
                                    onClick={() => setFormData({ ...formData, role: 'USER' })}
                                >
                                    <UserIcon className="w-4 h-4" /> Regular User
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic mt-2 ml-1">Warning: Elevating a user to Admin grants full access to this panel.</p>
                        </div>
                    </CardContent>
                    <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2 font-black uppercase tracking-widest px-8 shadow-lg shadow-primary/20 rounded-xl h-11"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Sync Changes
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
