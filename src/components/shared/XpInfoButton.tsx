'use client'

import { Info, Sparkles, Heart, ListPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function XpInfoButton() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                >
                    <Info className="h-4 w-4" />
                    <span className="sr-only">XP Information</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-white/10 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        How to Earn XP
                    </DialogTitle>
                    <DialogDescription>
                        Complete activities to level up and unlock new ranks!
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4 py-4">
                        {/* Task Item 1 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-white/5">
                            <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                                <Heart className="h-5 w-5 text-pink-500" />
                            </div>
                            <div>
                                <h4 className="font-bold">Add Favorites</h4>
                                <p className="text-sm text-muted-foreground">
                                    Add an anime or manga to your favorites list.
                                </p>
                                <p className="text-sm font-black text-primary mt-1">+100 XP</p>
                            </div>
                        </div>

                        {/* Task Item 2 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-white/5">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <ListPlus className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-bold">Track Your List</h4>
                                <p className="text-sm text-muted-foreground">
                                    Add items to your watchlist or reading list.
                                </p>
                                <p className="text-sm font-black text-primary mt-1">+50 XP</p>
                            </div>
                        </div>

                        {/* Task Item 3 */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-white/5">
                            <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                <Users className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-bold">Make Friends</h4>
                                <p className="text-sm text-muted-foreground">
                                    Connect with other users on the platform.
                                </p>
                                <p className="text-sm font-black text-primary mt-1">+200 XP</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-primary/5 text-center">
                            <p className="text-xs text-muted-foreground font-medium">
                                Level up to unlock special badges and earn your place on the leaderboard!
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
