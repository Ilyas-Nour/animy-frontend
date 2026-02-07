'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Loader2,
    Save,
    Camera,
    Image as ImageIcon,
    User,
    Mail,
    Lock,
    Sparkles,
    Palette,
    Shield,
    Check,
    Users
} from 'lucide-react'
import Image from 'next/image'
import confetti from 'canvas-confetti'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { getAvatarUrl, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SocialLinksEditor } from '@/components/profile/SocialLinksEditor'


// Validation Schema
const profileSchema = z.object({
    firstName: z.string().min(2, 'Name too short'),
    lastName: z.string().optional(),
    bio: z.string().max(300, 'Bio must be less than 300 characters').optional(),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

// --- Components ---

// Neon Input Wrapper
const NeonInput = ({ children, focused }: { children: React.ReactNode, focused?: boolean }) => (
    <div className={cn(
        "relative transition-all duration-300 rounded-xl p-[1px]",
        focused ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-border dark:bg-white/10"
    )}>
        {children}
    </div>
)

export function EditProfileForm() {
    const { user, updateUser, refreshProfile } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)
    const [focusedField, setFocusedField] = useState<string | null>(null)

    // Parallax logic
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const mouseX = useSpring(x, { stiffness: 50, damping: 20 })
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 })

    function onMouseMove(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
        const cx = left + width / 2
        const cy = top + height / 2
        x.set(event.clientX - cx)
        y.set(event.clientY - cy)
    }

    function onMouseLeave() {
        x.set(0)
        y.set(0)
    }

    const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])


    // Hidden file inputs
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            bio: user?.bio || '',
        },
    })

    const passwordForm = useForm<PasswordValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    })

    // Reset form when user loads
    useEffect(() => {
        if (user) {
            form.reset({
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio || '',
            })
        }
    }, [user, form])

    // Calculate Identity Strength
    const calculateStrength = () => {
        let score = 0
        const total = 5
        if (user?.avatar) score++
        if (user?.bannerUrl) score++
        if (user?.firstName) score++
        if (user?.lastName) score++
        if (user?.bio) score++
        return Math.round((score / total) * 100)
    }
    const strength = calculateStrength()

    // Helper to safely extract error message string
    const getErrorMessage = (error: any) => {
        const data = error.response?.data;
        if (!data) return error.message || 'Connection error';

        // Handle NestJS style error objects
        const message = data.message || data.error;
        if (Array.isArray(message)) return message[0];
        if (typeof message === 'object' && message !== null) {
            return message.message || JSON.stringify(message);
        }
        return String(message || 'An unexpected error occurred');
    }


    // Handle File Selections
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            if (type === 'avatar') setAvatarPreview(reader.result as string)
            if (type === 'banner') setBannerPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const onPasswordSubmit = async (values: PasswordValues) => {
        try {
            setIsLoading(true)
            await api.patch('/users/password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            })
            toast.success("Security Upgraded", {
                description: "Password successfully updated.",
                icon: '🛡️'
            })
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ef4444', '#b91c1c', '#ffffff']
            });
            passwordForm.reset()
        } catch (error: any) {
            toast.error("Access Denied", {
                description: getErrorMessage(error)
            })
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (values: ProfileValues) => {
        try {
            setIsLoading(true)

            // 1. Upload Avatar if changed
            if (avatarInputRef.current?.files?.[0]) {
                const formData = new FormData()
                formData.append('avatar', avatarInputRef.current.files[0])
                await api.post('/users/upload-avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            // 2. Upload Banner if changed
            if (bannerInputRef.current?.files?.[0]) {
                const formData = new FormData()
                formData.append('banner', bannerInputRef.current.files[0])
                await api.post('/users/upload-banner', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            // 3. Update Text Data
            const res = await api.patch('/users/profile', values)
            console.log('[EditProfileForm] Patch response:', res.data)


            // 4. Refresh User Data in Context (fetches fresh data including Supabase URLs)
            await refreshProfile()

            toast.success("Identity Forged", {
                description: "Profile updated successfully.",
                icon: '💎' // Gem icon
            })

            // CELEBRATION
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#ec4899']
            });

            // Clear previews
            setAvatarPreview(null)
            setBannerPreview(null)

        } catch (error: any) {
            console.error(error)
            toast.error("Sync Failed", {
                description: getErrorMessage(error)
            })
        } finally {
            setIsLoading(false)
        }
    }

    const currentBanner = bannerPreview || (user?.bannerUrl ? getAvatarUrl(user.bannerUrl) : null)
    const currentAvatar = avatarPreview || (user?.avatar ? getAvatarUrl(user.avatar) : null)

    // Helper for validation errors
    const getError = (errors: any, field: string) => errors[field]?.message

    return (
        <div className="max-w-4xl mx-auto pb-24">

            {/* 3D PARALLAX HEADER */}
            <div className="perspective-[1000px] mb-16 relative z-10">
                <motion.div
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    className="relative group rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] bg-card dark:bg-zinc-900 border border-border h-[450px] md:h-auto md:aspect-[3.5/1]"
                >
                    {/* Background Layer (Deepest) */}
                    <motion.div
                        style={{ translateZ: -50 }}
                        className="absolute inset-0 bg-black"
                    />

                    {/* Banner Layer */}
                    <motion.div
                        style={{ translateZ: 0 }}
                        className="absolute inset-0"
                    >
                        {currentBanner ? (
                            <Image
                                src={currentBanner}
                                alt="Banner Preview"
                                fill
                                className="object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000 ease-out"
                            />
                        ) : (
                            <div className="w-full h-full bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-black" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </motion.div>

                    {/* Floating Info Layer */}
                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end justify-center md:justify-start">
                        <motion.div
                            style={{ translateZ: 50 }}
                            className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 w-full"
                        >
                            {/* Avatar */}
                            <div className="relative group/avatar shrink-0">
                                <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-[6px] border-background dark:border-zinc-950 bg-muted dark:bg-zinc-800 overflow-hidden shadow-2xl relative">
                                    {currentAvatar ? (
                                        <Image src={currentAvatar} alt="Avatar" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/20">
                                            {(user?.firstName?.[0] || 'A')}
                                        </div>
                                    )}
                                    <div
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm"
                                        onClick={() => avatarInputRef.current?.click()}
                                    >
                                        <Camera className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                                    </div>
                                </div>
                                {/* Online Indicator */}
                                <div className="absolute bottom-2 right-1 md:bottom-4 md:right-2 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-4 border-zinc-950 shadow-lg" />
                            </div>

                            {/* Text Info */}
                            <div className="pb-0 md:pb-4 text-white flex-1 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 w-full text-center md:text-left">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-2xl text-white mix-blend-difference">
                                        {form.watch('firstName') || 'Agent'} {form.watch('lastName')}
                                    </h1>
                                    <p className="text-white/80 font-medium text-lg flex items-center justify-center md:justify-start gap-2 mt-1 mix-blend-difference">
                                        <span className="text-cyan-400">@{user?.username}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/50" />
                                        <span>Level {user?.level || 1}</span>
                                    </p>
                                </div>

                                {/* Edit Banner Button (Floating) */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2 bg-background/50 hover:bg-background/80 text-foreground backdrop-blur-md border border-border rounded-xl"
                                    onClick={() => bannerInputRef.current?.click()}
                                >
                                    <ImageIcon className="w-4 h-4" /> Edit Banner
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Gloss / Light Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent pointer-events-none mix-blend-overlay" />
                </motion.div>
            </div>

            {/* IDENTITY STRENGTH METER */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12 bg-card dark:bg-zinc-900/50 border border-border rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />

                <div className="relative shrink-0 w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-muted/30 dark:text-zinc-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                        <motion.circle
                            className="text-cyan-500 dark:text-cyan-400 stroke-current drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                            strokeWidth="8"
                            strokeLinecap="round"
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * strength) / 100}
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 - (251.2 * strength) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        ></motion.circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-foreground text-lg">{strength}%</div>
                </div>

                <div className="flex-1 space-y-2 relative z-10 text-center md:text-left">
                    <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2 text-foreground">
                        Identity Strength <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Complete your profile to unlock special badges and boost visibility.
                    </p>
                    <div className="flex gap-2 justify-center md:justify-start pt-1">
                        {user?.avatar && <div className="text-[10px] font-bold px-2 py-1 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-md border border-green-500/20 flex items-center gap-1"><Check className="w-3 h-3" /> Avatar</div>}
                        {user?.bannerUrl && <div className="text-[10px] font-bold px-2 py-1 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-md border border-green-500/20 flex items-center gap-1"><Check className="w-3 h-3" /> Banner</div>}
                        {user?.bio && <div className="text-[10px] font-bold px-2 py-1 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-md border border-green-500/20 flex items-center gap-1"><Check className="w-3 h-3" /> Bio</div>}
                    </div>
                </div>
            </motion.div>


            {/* MAIN FORM AREA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Tabs defaultValue="identity" className="w-full">
                    <TabsList className="relative w-full grid grid-cols-4 bg-muted/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-border p-1 mb-10 rounded-2xl h-14">
                        {/* Animated Tab Background handled by TabsTrigger mostly, but simplified here for reliability */}
                        <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-background dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground dark:data-[state=active]:text-white font-bold transition-all duration-300 text-xs md:text-sm">
                            <User className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Identity
                        </TabsTrigger>
                        <TabsTrigger value="visuals" className="rounded-xl data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 font-bold transition-all duration-300 text-xs md:text-sm">
                            <Palette className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Aesthetics
                        </TabsTrigger>
                        <TabsTrigger value="social" className="rounded-xl data-[state=active]:bg-indigo-900/30 data-[state=active]:text-indigo-300 font-bold transition-all duration-300 text-xs md:text-sm">
                            <Users className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Social
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-red-900/20 data-[state=active]:text-red-400 font-bold transition-all duration-300 text-xs md:text-sm">
                            <Shield className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Security
                        </TabsTrigger>
                    </TabsList>


                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <TabsContent value="identity" className="space-y-8">
                            <Card className="bg-card/50 dark:bg-zinc-900/30 border-border backdrop-blur-xl p-8 md:p-10 rounded-[2rem] space-y-8 shadow-2xl relative overflow-hidden">
                                {/* Background glow */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-3">
                                        <Label htmlFor="firstName" className="flex items-center gap-2 text-muted-foreground font-semibold"><User className="w-4 h-4" /> First Name</Label>
                                        <NeonInput focused={focusedField === 'firstName'}>
                                            <Input
                                                id="firstName"
                                                {...form.register('firstName')}
                                                onFocus={() => setFocusedField('firstName')}
                                                onBlur={() => setFocusedField(null)}
                                                className="bg-background/80 dark:bg-zinc-900/80 border-none h-14 rounded-xl text-lg backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50"
                                            />
                                        </NeonInput>
                                        {getError(form.formState.errors, 'firstName') && <p className="text-red-400 text-sm font-medium animate-pulse">{getError(form.formState.errors, 'firstName')}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="lastName" className="flex items-center gap-2 text-muted-foreground font-semibold"><User className="w-4 h-4" /> Last Name</Label>
                                        <NeonInput focused={focusedField === 'lastName'}>
                                            <Input
                                                id="lastName"
                                                {...form.register('lastName')}
                                                onFocus={() => setFocusedField('lastName')}
                                                onBlur={() => setFocusedField(null)}
                                                className="bg-background/80 dark:bg-zinc-900/80 border-none h-14 rounded-xl text-lg backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50"
                                            />
                                        </NeonInput>
                                        {getError(form.formState.errors, 'lastName') && <p className="text-red-400 text-sm font-medium animate-pulse">{getError(form.formState.errors, 'lastName')}</p>}
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <Label htmlFor="bio" className="flex items-center gap-2 text-muted-foreground font-semibold"><Sparkles className="w-4 h-4" /> Bio / Tagline</Label>
                                    <NeonInput focused={focusedField === 'bio'}>
                                        <Textarea
                                            id="bio"
                                            {...form.register('bio')}
                                            onFocus={() => setFocusedField('bio')}
                                            onBlur={() => setFocusedField(null)}
                                            className="bg-background/80 dark:bg-zinc-900/80 border-none min-h-[140px] rounded-xl text-lg backdrop-blur-sm resize-none text-foreground placeholder:text-muted-foreground/50"
                                            placeholder="Tell the world your story..."
                                        />
                                    </NeonInput>
                                    <div className="flex justify-between items-center text-xs text-zinc-500 font-mono">
                                        {getError(form.formState.errors, 'bio') && <p className="text-red-400 font-sans">{getError(form.formState.errors, 'bio')}</p>}
                                        <span>{form.watch('bio')?.length || 0}/300 CHARS</span>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex justify-end pt-4 sticky bottom-8 z-50 pointer-events-none">
                                <div className="pointer-events-auto">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isLoading}
                                        className="h-12 px-6 md:h-16 md:px-10 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all duration-300 font-bold md:font-black text-base md:text-xl tracking-wide group"
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-2 animate-spin" /> SYNCING...</>
                                        ) : (
                                            <><Save className="w-5 h-5 md:w-6 md:h-6 mr-2 group-hover:rotate-12 transition-transform" /> SAVE IDENTITY</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="visuals" className="space-y-6">
                            <Card className="bg-card/50 dark:bg-zinc-900/30 border-border backdrop-blur-xl p-8 md:p-12 rounded-[2rem] text-center">
                                <div className="py-8 space-y-6">
                                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-pulse">
                                        <Palette className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-foreground">Visual Customization</h3>
                                        <p className="text-muted-foreground max-w-md mx-auto mt-2 text-lg">
                                            Use the 3D interactive preview at the top to change your Banner and Avatar directly.
                                        </p>
                                    </div>
                                    <div className="flex justify-center gap-4 pt-6">
                                        <Button type="button" variant="outline" className='h-12 px-6 rounded-xl border-border hover:bg-muted' onClick={() => bannerInputRef.current?.click()}>
                                            Upload Banner
                                        </Button>
                                        <Button type="button" variant="outline" className='h-12 px-6 rounded-xl border-border hover:bg-muted' onClick={() => avatarInputRef.current?.click()}>
                                            Upload Avatar
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                            <div className="flex justify-end pt-4 sticky bottom-8 z-50 pointer-events-none">
                                <div className="pointer-events-auto">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isLoading}
                                        className="h-12 px-6 md:h-16 md:px-10 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all duration-300 font-bold md:font-black text-base md:text-xl tracking-wide group"
                                    >
                                        {isLoading ? (
                                            <><Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-2 animate-spin" /> SYNCING...</>
                                        ) : (
                                            <><Save className="w-5 h-5 md:w-6 md:h-6 mr-2 group-hover:rotate-12 transition-transform" /> SAVE IDENTITY</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </form>

                    <TabsContent value="social" className="space-y-6">
                        <Card className="bg-card/50 dark:bg-zinc-900/30 border-border backdrop-blur-xl p-8 md:p-10 rounded-[2rem]">
                            <SocialLinksEditor
                                initialLinks={{
                                    instagram: user?.instagram,
                                    github: user?.github,
                                    linkedin: user?.linkedin,
                                    tiktok: user?.tiktok,
                                    whatsapp: user?.whatsapp,
                                    facebook: user?.facebook,
                                    snapchat: user?.snapchat,
                                }}
                                onUpdate={() => {
                                    // Refresh user data after update
                                    if (updateUser) {
                                        api.get('/users/profile').then(res => {
                                            const userData = res.data.data || res.data
                                            updateUser(userData)
                                        })
                                    }
                                }}
                            />
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <Card className="bg-red-950/5 dark:bg-red-950/10 border-red-500/10 backdrop-blur-xl p-8 md:p-10 rounded-[2rem]">
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8 max-w-lg mx-auto">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto flex items-center justify-center mb-4 text-red-500">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-red-400">Security Credentials</h3>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        {...passwordForm.register('currentPassword')}
                                        className="bg-background/50 dark:bg-black/40 border-red-500/20 h-12 rounded-xl focus:border-red-500"
                                    />
                                    {getError(passwordForm.formState.errors, 'currentPassword') && <p className="text-red-400 text-sm">{getError(passwordForm.formState.errors, 'currentPassword')}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        {...passwordForm.register('newPassword')}
                                        className="bg-background/50 dark:bg-black/40 border-red-500/20 h-12 rounded-xl focus:border-red-500"
                                    />
                                    {getError(passwordForm.formState.errors, 'newPassword') && <p className="text-red-400 text-sm">{getError(passwordForm.formState.errors, 'newPassword')}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        {...passwordForm.register('confirmPassword')}
                                        className="bg-background/50 dark:bg-black/40 border-red-500/20 h-12 rounded-xl focus:border-red-500"
                                    />
                                    {getError(passwordForm.formState.errors, 'confirmPassword') && <p className="text-red-400 text-sm">{getError(passwordForm.formState.errors, 'confirmPassword')}</p>}
                                </div>

                                <Button type="submit" variant="destructive" disabled={isLoading} className="w-full h-14 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all">
                                    {isLoading ? 'Decrypting...' : 'Update Credentials'}
                                </Button>
                            </form>
                        </Card>
                    </TabsContent>

                </Tabs>
            </motion.div>

            {/* Hidden inputs in case they are outside the form scope (handled by refs) */}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
        </div>
    )
}
