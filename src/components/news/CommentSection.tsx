'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Reply, Heart, Edit2, Trash2, X, Check, MoreVertical, UserPlus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import api from '@/lib/api'
import { toast } from 'sonner'
import { getAvatarUrl, getInitials, cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { usePathname, useSearchParams } from 'next/navigation'

interface Comment {
    id: string
    content: string
    createdAt: string
    userId: string
    isLiked?: boolean
    _count?: {
        reactions: number
        replies: number
    }
    user: {
        id: string
        username: string
        avatar?: string
        firstName?: string
    }
    replies: Comment[]
}

export function CommentSection({ newsId }: { newsId: string }) {
    const { user } = useAuth()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [friends, setFriends] = useState<Set<string>>(new Set())

    const fetchFriends = async () => {
        if (!user) return
        try {
            const res = await api.get('/friends/list')
            const { friends: accepted, incomingRequests, outgoingRequests } = res.data?.data || {}

            const relationshipIds = new Set<string>()

            accepted?.forEach((f: any) => relationshipIds.add(f.id))
            incomingRequests?.forEach((r: any) => relationshipIds.add(r.id))
            outgoingRequests?.forEach((r: any) => relationshipIds.add(r.id))

            setFriends(relationshipIds)
        } catch (error) {
            console.error("Failed to fetch friends", error)
        }
    }

    const fetchComments = async () => {
        try {
            const url = `/comments/${newsId}${user ? `?userId=${user.id}` : ''}`
            const res = await api.get(url)
            setComments(res.data.data || [])
        } catch (error) {
            console.error("Failed to fetch comments", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchComments()
        fetchFriends()
    }, [newsId, user])

    const scrollToHash = () => {
        if (typeof window === 'undefined') return
        const hash = window.location.hash
        if (hash.startsWith('#comment-')) {
            const commentId = hash.replace('#comment-', '')
            // Small delay to ensure comments are rendered
            setTimeout(() => {
                const el = document.getElementById(`comment-${commentId}`)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    // High-visibility highlight
                    el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-4', 'ring-offset-background', 'animate-pulse')
                    console.log(`[CommentSection] Scrolled to target: ${commentId}`)
                    setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-4', 'ring-offset-background', 'animate-pulse')
                    }, 3000)
                }
            }, 500)
        }
    }

    // Effect for initial load and data changes
    useEffect(() => {
        if (comments.length > 0) {
            scrollToHash()
        }
    }, [comments, pathname, searchParams])

    // Specific listener for hash changes (same-page navigation)
    useEffect(() => {
        window.addEventListener('hashchange', scrollToHash)
        return () => window.removeEventListener('hashchange', scrollToHash)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast.error('Please sign in to join the discussion');
            return;
        }
        if (!newComment.trim()) return

        try {
            await api.post('/comments', {
                providerId: newsId,
                content: newComment,
                parentId: replyTo
            })

            setNewComment('')
            setReplyTo(null)
            fetchComments()
            toast.success('Comment Intercepted')
        } catch (error: any) {
            let msg = error.response?.data?.message || 'Signal lost'
            if (typeof msg === 'object') msg = Array.isArray(msg) ? msg.join(', ') : JSON.stringify(msg)
            toast.error(msg)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/comments/${id}`)
            setComments(prev => removeCommentFromList(prev, id))
            toast.success('Memory erased')
        } catch (error) {
            toast.error('Deletion failed')
        }
    }

    const removeCommentFromList = (list: Comment[], id: string): Comment[] => {
        return list.filter(c => c.id !== id).map(c => ({
            ...c,
            replies: removeCommentFromList(c.replies || [], id)
        }))
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Live Discussion Hub</h4>
                <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="relative group">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? "Targeting thread..." : "Inject thought into feed..."}
                    className="w-full bg-secondary/50 border border-border rounded-[1.5rem] px-6 py-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/50 shadow-inner"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>

            {replyTo && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                        <Reply className="w-3 h-3" />
                        Replying to signal
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-indigo-500/20 rounded-md transition-colors text-indigo-500">
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {/* List */}
            <div className="space-y-4">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={setReplyTo}
                        onDelete={handleDelete}
                        currentUserId={user?.id}
                        friends={friends}
                    />
                ))}
                {comments.length === 0 && !isLoading && (
                    <div className="py-12 text-center rounded-[2rem] border border-dashed border-border bg-secondary/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Frequency clear. No thoughts detected.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function CommentItem({
    comment,
    onReply,
    onDelete,
    currentUserId,
    friends
}: {
    comment: Comment,
    onReply: (id: string) => void,
    onDelete: (id: string) => void,
    currentUserId?: string,
    friends: Set<string>
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [localIsLiked, setLocalIsLiked] = useState(comment.isLiked || false)
    const [localLikeCount, setLocalLikeCount] = useState(comment._count?.reactions || 0)
    const [requestSent, setRequestSent] = useState(false)

    const isOwner = currentUserId === comment.user.id

    const handleLike = async () => {
        const wasLiked = localIsLiked
        setLocalIsLiked(!wasLiked)
        setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1)

        try {
            await api.post('/reactions', { type: 'LIKE', commentId: comment.id })
        } catch (error) {
            setLocalIsLiked(wasLiked)
            setLocalLikeCount(prev => wasLiked ? prev + 1 : prev - 1)
            toast.error('Comm-link failed')
        }
    }

    const handleConnect = async () => {
        if (requestSent) return
        try {
            await api.post('/friends/request', { username: comment.user.username })
            setRequestSent(true)
            toast.success(`Signal sent to @${comment.user.username}`)
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Synchronization failed'
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
        }
    }

    const handleUpdate = async () => {
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false)
            return
        }

        try {
            await api.patch(`/comments/${comment.id}`, { content: editContent })
            comment.content = editContent
            setIsEditing(false)
            toast.success('Data overwritten')
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Upload failed'
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
        }
    }

    return (
        <div id={`comment-${comment.id}`} className="group space-y-4 scroll-mt-32">
            <div className="relative flex gap-4 p-4 rounded-[1.5rem] bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all duration-500">

                {/* Visual Connector for thread */}
                {comment.replies?.length > 0 && (
                    <div className="absolute top-[3.5rem] bottom-0 left-[1.5rem] w-0.5 bg-gradient-to-b from-border to-transparent" />
                )}

                {/* Avatar - Clickable */}
                <Link href={`/users/${comment.user.username}`} className="shrink-0 group/avatar">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 overflow-hidden border border-border shadow-md transform group-hover/avatar:scale-105 transition-transform">
                        {comment.user.avatar ? (
                            <img
                                src={getAvatarUrl(comment.user.avatar)}
                                alt={comment.user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[11px] font-black text-foreground">
                                {getInitials(comment.user.firstName || comment.user.username)}
                            </div>
                        )}
                    </div>
                </Link>

                {/* Content Area */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href={`/users/${comment.user.username}`} className="hover:text-primary transition-colors">
                                <span className="text-xs font-black text-foreground hover:text-inherit">{comment.user.firstName || comment.user.username}</span>
                            </Link>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                        </div>

                        {/* Actions Menu */}
                        {isOwner && !isEditing && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-indigo-500/10 hover:text-indigo-500 rounded-lg transition-all text-muted-foreground/30">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(comment.id)} className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all text-muted-foreground/30">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mt-2 space-y-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-background border border-indigo-500/30 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                rows={2}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 hover:bg-secondary rounded-lg text-[10px] font-black uppercase text-muted-foreground">
                                    Abort
                                </button>
                                <button onClick={handleUpdate} className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-indigo-500/20">
                                    Commit
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">{comment.content}</p>
                    )}

                    {/* Footer Actions */}
                    {!isEditing && (
                        <div className="flex items-center gap-6 mt-3">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                    localIsLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Heart className={cn("w-3.5 h-3.5", localIsLiked && "fill-current")} />
                                <span>{localLikeCount > 0 ? localLikeCount : 'Pulse'}</span>
                            </button>

                            <button
                                onClick={() => onReply(comment.id)}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground hover:text-indigo-500 transition-all"
                            >
                                <Reply className="w-3.5 h-3.5" />
                                Reply
                            </button>

                            {/* Connect Button */}
                            {!isOwner && currentUserId && !friends.has(comment.user.id) && (
                                <button
                                    onClick={handleConnect}
                                    disabled={requestSent}
                                    className={cn(
                                        "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                                        requestSent ? "text-green-500 opacity-50 cursor-default" : "text-muted-foreground hover:text-cyan-500"
                                    )}
                                >
                                    {requestSent ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                    {requestSent ? 'Sent' : 'Connect'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies with refined connector */}
            {comment.replies?.length > 0 && (
                <div className="pl-6 space-y-4 relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-border/30" />
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                            friends={friends}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
