'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Volume2, VolumeX, Settings2, Trash2 } from 'lucide-react'

interface ChatSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isMuted: boolean
    toggleMute: () => void
    volume: number
    onVolumeChange: (val: number) => void
    onTestSound: () => void
    onClearChat: () => void
}

export function ChatSettingsModal({
    open,
    onOpenChange,
    isMuted,
    toggleMute,
    volume,
    onVolumeChange,
    onTestSound,
    onClearChat
}: ChatSettingsModalProps) {
    const [confirmClear, setConfirmClear] = React.useState(false)

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value)
        onVolumeChange(val)
    }

    const handleVolumeMouseUp = () => {
        // Play sound when user finishes adjusting volume as a preview
        onTestSound()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-purple-500" />
                        Chat Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Mute Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-medium">Mute Sounds</p>
                                <p className="text-xs text-muted-foreground">Silence all notification sounds</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleMute}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isMuted ? 'bg-purple-600' : 'bg-muted'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMuted ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Notification Volume</label>
                            <span className="text-sm font-bold text-purple-500">{Math.round(volume * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <VolumeX className="w-4 h-4 text-muted-foreground" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                onMouseUp={handleVolumeMouseUp}
                                onTouchEnd={handleVolumeMouseUp}
                                className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <Volume2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                            A preview sound will play when you release the slider
                        </p>
                    </div>

                    {/* Clear Chat */}
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-sm font-medium mb-3">Conversation Actions</p>
                        {confirmClear ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <button
                                    onClick={() => { onClearChat(); setConfirmClear(false); onOpenChange(false); }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg shadow-lg"
                                >
                                    Yes, Clear Everything
                                </button>
                                <button
                                    onClick={() => setConfirmClear(false)}
                                    className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-xs rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmClear(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Chat History
                            </button>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            This will only clear the chat for you. Your friend will still see the messages.
                        </p>
                    </div>

                    <div className="pt-2 text-[10px] text-center text-muted-foreground">
                        Settings are automatically saved to your browser
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
