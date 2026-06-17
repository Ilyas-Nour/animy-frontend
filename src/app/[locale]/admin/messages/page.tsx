'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Mail,
    Trash2,
    CheckCircle,
    Clock,
    User,
    Search,
    ChevronDown,
    ExternalLink,
    MessageSquare
} from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null)

    const fetchMessages = async () => {
        try {
            const res = await api.get('/admin/messages')
            const data = Array.isArray(res.data) ? res.data : res.data?.data || []
            setMessages(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to fetch messages', error)
            setMessages([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages()
    }, [])

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/admin/messages/${id}/read`)
            fetchMessages()
        } catch (error) {
            console.error('Failed to mark as read', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this message?')) return
        try {
            await api.delete(`/admin/messages/${id}`)
            fetchMessages()
            if (selectedMessage === id) setSelectedMessage(null)
        } catch (error) {
            console.error('Failed to delete', error)
        }
    }

    const filtered = Array.isArray(messages) ? messages.filter(m =>
        m.subject.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    ) : []

    return (
        <div className="space-y-6 sm:space-y-8 px-4 sm:px-0 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">System <span className="text-primary italic">Feedback</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage user messages and inquiries.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search messages..."
                        className="pl-10 rounded-xl h-10 sm:h-11 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)
                ) : filtered.length === 0 ? (
                    <Card className="p-20 text-center border-dashed bg-muted/20">
                        <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                        <p className="text-muted-foreground italic font-medium">No messages found.</p>
                    </Card>
                ) : (
                    filtered.map((msg) => (
                        <Card
                            key={msg.id}
                            className={cn(
                                "border-none shadow-md transition-all overflow-hidden sm:rounded-2xl rounded-xl",
                                !msg.isRead ? "ring-1 ring-primary/20 bg-primary/5 shadow-primary/5" : "bg-card/60 backdrop-blur-sm"
                            )}
                        >
                            <CardContent className="p-0">
                                <div
                                    className="p-4 sm:p-6 cursor-pointer hover:bg-accent/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    onClick={() => setSelectedMessage(selectedMessage === msg.id ? null : msg.id)}
                                >
                                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                        <div className={cn(
                                            "mt-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                            !msg.isRead ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                                        )}>
                                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <h3 className="font-black text-base sm:text-lg leading-tight truncate">{msg.subject}</h3>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground font-medium">
                                                <span className="flex items-center gap-1 text-foreground/80 font-bold whitespace-nowrap">
                                                    <User className="w-3 h-3" /> {msg.name}
                                                </span>
                                                <span className="flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                                    <Mail className="w-3 h-3" /> <span className="truncate max-w-[150px]">{msg.email}</span>
                                                </span>
                                                <span className="flex items-center gap-1 opacity-60 whitespace-nowrap">
                                                    <Clock className="w-3 h-3" /> {new Date(msg.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {!msg.isRead && (
                                            <Badge className="bg-primary hover:bg-primary font-black px-3 text-[9px] uppercase tracking-wider">New</Badge>
                                        )}
                                        <ChevronDown className={cn("w-5 h-5 transition-transform opacity-40", selectedMessage === msg.id ? "rotate-180 opacity-100" : "")} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {selectedMessage === msg.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-border bg-accent/20"
                                        >
                                            <div className="p-6 space-y-4">
                                                <div className="bg-background rounded-xl p-5 border shadow-inner italic text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                    &ldquo;{msg.message}&rdquo;
                                                </div>
                                                <div className="flex justify-end gap-2 p-2">
                                                    {!msg.isRead && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="gap-2"
                                                            onClick={() => handleMarkAsRead(msg.id)}
                                                        >
                                                            <CheckCircle className="w-4 h-4" /> Mark Read
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="gap-2"
                                                        onClick={() => handleDelete(msg.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-2" asChild>
                                                        <a href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}>
                                                            <ExternalLink className="w-4 h-4" /> Reply via Email
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
