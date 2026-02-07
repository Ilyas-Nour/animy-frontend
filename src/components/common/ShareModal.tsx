
'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSocket } from '@/contexts/SocketContext'
import api from '@/lib/api'
import { Share2, Copy, Send, Check } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { getAvatarUrl } from '@/lib/utils'

interface Friend {
    id: string
    username: string
    avatar: string | null
    status?: string
}

interface ShareModalProps {
    title: string
    description?: string
    image?: string
    type: 'ANIME' | 'MANGA' | 'CHARACTER' | 'PROFILE'
    id: string | number
    path: string
    trigger?: React.ReactNode
}

export function ShareModal({ title, description, image, type, id, path, trigger }: ShareModalProps) {
    const { socket, isConnected } = useSocket()
    const [friends, setFriends] = useState<Friend[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [copied, setCopied] = useState(false)

    // Fetch friends on open - Removed isConnected dependency
    useEffect(() => {
        if (open) {
            const fetchFriends = async () => {
                try {
                    setLoading(true)
                    console.log('ShareModal: Fetching friends list...');
                    const res = await api.get('/friends/list')

                    console.log('ShareModal: Raw API Response:', res.data);

                    // The backend uses a TransformInterceptor that wraps data in a 'data' property
                    // res.data is the Axios response body (the JSON)
                    // res.data.data is the actual object returned by FriendsService
                    const responseData = res.data;

                    let friendsList: Friend[] = [];

                    if (responseData.data && Array.isArray(responseData.data.friends)) {
                        friendsList = responseData.data.friends;
                    } else if (Array.isArray(responseData.friends)) {
                        friendsList = responseData.friends;
                    } else if (Array.isArray(responseData.data)) {
                        friendsList = responseData.data;
                    }

                    console.log('ShareModal: Extracted friends count:', friendsList.length);
                    setFriends(friendsList)
                } catch (error) {
                    console.error('ShareModal: Failed to fetch friends', error)
                    toast.error('Failed to load friend list')
                } finally {
                    setLoading(false)
                }
            }
            fetchFriends()
        }
    }, [open])

    const handleShareToChat = (friendId: string, friendName: string) => {
        console.log('ShareModal: Attempting to share...', { friendId, friendName, type, title, isConnected, socketId: socket?.id });

        if (!socket || !isConnected) {
            console.error('ShareModal: Cannot share - socket not connected');
            toast.error('Chat connection not available. Please try again.')
            return
        }

        try {
            socket.emit('message:send', {
                to: friendId,
                content: `Shared ${type.toLowerCase()}: ${title}`, // Fallback text
                type: 'MEDIA_CARD', // Maps to Backend MessageType
                mediaId: id.toString(),
                mediaType: type,
                mediaTitle: title,
                mediaImage: image
            })
            console.log('ShareModal: message:send emitted successfully');
            toast.success(`Shared with ${friendName}!`)
        } catch (err) {
            console.error('ShareModal: Error emitting message:', err);
            toast.error('Failed to send message')
        }
    }

    const handleCopyLink = () => {
        const url = `${window.location.origin}${path}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleNativeShare = async () => {
        const url = `${window.location.origin}${path}`
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out ${title} on Animy`,
                    text: description || `Look at this ${type.toLowerCase()}!`,
                    url: url
                })
            } catch (err) {
                console.error('Share failed', err)
            }
        }
    }

    const filteredFriends = friends.filter(f =>
        (f.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="icon" className="rounded-full bg-background/50 backdrop-blur-md">
                        <Share2 className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle>Share {title}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chat">Send to Friend</TabsTrigger>
                        <TabsTrigger value="link">Share Link</TabsTrigger>
                    </TabsList>

                    {/* Share to Chat Tab */}
                    <TabsContent value="chat" className="space-y-4 mt-4">
                        <Input
                            placeholder="Search friends..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    Loading friends...
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="font-medium text-lg">No friends found</p>
                                    <p className="text-sm mt-1">Make sure you have accepted friends to share with.</p>
                                </div>
                            ) : (
                                filteredFriends.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                                {friend.avatar ? (
                                                    <Image src={getAvatarUrl(friend.avatar) || friend.avatar} alt={friend.username} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full bg-primary/20 text-primary font-bold">
                                                        {friend.username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-medium">{friend.username}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground"
                                            onClick={() => handleShareToChat(friend.id, friend.username)}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Share Link Tab */}
                    <TabsContent value="link" className="space-y-6 mt-4">
                        <div className="flex items-center space-x-2">
                            <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}${path}`} readOnly className="bg-muted/30" />
                            <Button size="icon" onClick={handleCopyLink} variant="outline">
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="secondary" className="w-full h-12 gap-2" onClick={() => {
                                const url = `${window.location.origin}${path}`
                                window.open(`https://twitter.com/intent/tweet?text=Check out ${title}&url=${url}`, '_blank')
                            }}>
                                <span className="font-bold">Twitter</span>
                            </Button>
                            <Button variant="secondary" className="w-full h-12 gap-2" onClick={() => {
                                const url = `${window.location.origin}${path}`
                                window.open(`https://wa.me/?text=Check out ${title} ${url}`, '_blank')
                            }}>
                                <span className="font-bold">WhatsApp</span>
                            </Button>
                            <Button variant="outline" className="w-full col-span-2 h-12" onClick={handleNativeShare}>
                                More Sharing Options
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
