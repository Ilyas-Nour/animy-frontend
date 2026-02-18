'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/context/AuthContext'
import ConversationSidebar from '@/components/chat/ConversationSidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import { MessageCircle } from 'lucide-react'

function ChatContent() {
    const { user } = useAuth()
    const { socket, isConnected } = useSocket()
    const searchParams = useSearchParams()
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    // Check for friendId in URL
    useEffect(() => {
        const friendId = searchParams.get('friendId')
        if (friendId) {
            setSelectedFriendId(friendId)
        }
    }, [searchParams])

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
                    <p className="text-gray-500">You need to be logged in to access the chat.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 pt-8 pb-20 md:pb-0 h-[calc(100vh-64px)]">
            <div className="bg-card/50 backdrop-blur-md rounded-t-xl shadow-2xl border-x border-t border-border/50 overflow-hidden h-full flex">

                {/* Sidebar - Hidden on mobile if chat is selected */}
                {(!isMobile || !selectedFriendId) && (
                    <ConversationSidebar
                        selectedFriendId={selectedFriendId}
                        onSelectFriend={setSelectedFriendId}
                        isMobile={isMobile}
                    />
                )}

                {/* Chat Window - Hidden on mobile if no friend selected */}
                {(!isMobile || selectedFriendId) && (
                    <div className="flex-1 flex flex-col bg-background/50">
                        {selectedFriendId ? (
                            <ChatWindow
                                friendId={selectedFriendId}
                                onBack={() => setSelectedFriendId(null)}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <div className="text-center p-6">
                                    <MessageCircle className="w-20 h-20 mx-auto mb-4 opacity-20" />
                                    <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                                    <p className="text-sm opacity-70">
                                        Choose a friend to start chatting
                                    </p>
                                    {!isConnected && (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                            <span className="text-xs">Connecting...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
export default function ChatPage() { return <Suspense fallback={<div className='flex h-screen items-center justify-center'>Loading...</div>}><ChatContent /></Suspense> }
