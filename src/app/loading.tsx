import { Flame } from 'lucide-react'

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center animate-pulse">
                        <Flame className="w-8 h-8 text-orange-500 animate-bounce" />
                    </div>
                    <div className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/60 animate-pulse">
                    Synchronizing Reality...
                </p>
            </div>
        </div>
    )
}
