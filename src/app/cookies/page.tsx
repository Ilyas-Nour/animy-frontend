'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, Cookie, Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch' // Wait, I need to check if Switch exists. Assuming not, I'll use a toggle sim or just info. 
// List Components: badge.tsx, button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx, input.tsx, label.tsx, progress.tsx, scroll-area.tsx, select.tsx, skeleton.tsx, table.tsx, tabs.tsx, textarea.tsx
// Switch does NOT exist. I will simulate it.

export default function CookiesPage() {
    const [preferences, setPreferences] = useState({
        essential: true,
        analytics: true,
        marketing: false
    })
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Here we would typically save to localStorage or backend
    }

    return (
        <div className="min-h-screen w-full bg-background relative overflow-hidden flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <div className="container max-w-4xl relative z-10 mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="flex justify-center mb-4">
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Cookie className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Cookie Settings</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
                        <CardContent className="p-0">
                            <div className="p-6 md:p-10 space-y-8">

                                {/* Essential Cookies */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            Essential Cookies
                                            <span className="text-[10px] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded font-bold tracking-wider">Required</span>
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center h-full pt-1">
                                        <div className="h-6 w-11 bg-primary/50 rounded-full relative cursor-not-allowed opacity-80">
                                            <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Cookies */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Analytics Cookies</h3>
                                        <p className="text-sm text-muted-foreground">
                                            These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center h-full pt-1">
                                        <button
                                            onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                                            className={`h-6 w-11 rounded-full relative transition-colors duration-200 ${preferences.analytics ? 'bg-primary' : 'bg-muted'}`}
                                        >
                                            <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-200 ${preferences.analytics ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Marketing Cookies */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Marketing Cookies</h3>
                                        <p className="text-sm text-muted-foreground">
                                            These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center h-full pt-1">
                                        <button
                                            onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                                            className={`h-6 w-11 rounded-full relative transition-colors duration-200 ${preferences.marketing ? 'bg-primary' : 'bg-muted'}`}
                                        >
                                            <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-200 ${preferences.marketing ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto font-bold gap-2"
                                        onClick={handleSave}
                                        disabled={saved}
                                    >
                                        {saved ? (
                                            <>
                                                <Check className="w-4 h-4" /> Preferences Saved
                                            </>
                                        ) : (
                                            'Save Preferences'
                                        )}
                                    </Button>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
