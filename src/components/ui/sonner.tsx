'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, toast } from 'sonner'
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-center"
      className="toaster group"
      closeButton={true}
      richColors={false}
      expand={false}
      duration={4000}
      gap={10}
      visibleToasts={3}
      offset="20px"
      mobileOffset={{ top: '16px', left: '16px', right: '16px', bottom: '16px' }}
      swipeDirections={['top', 'left', 'right']}
      icons={{
        success: (
          <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        ),
        info: (
          <div className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-[0_0_12px_rgba(14,165,233,0.25)]">
            <Info className="w-3.5 h-3.5" />
          </div>
        ),
        warning: (
          <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        ),
        error: (
          <div className="w-6 h-6 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        ),
        loading: (
          <div className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        ),
        close: (
          <X className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast font-sans transition-all duration-300',
          title:
            'text-[13.5px] font-semibold text-zinc-100 tracking-tight leading-snug',
          description:
            'text-xs text-zinc-400 font-normal leading-relaxed mt-0.5',
          actionButton:
            'bg-primary text-primary-foreground text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors',
          cancelButton:
            'bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-zinc-700 transition-colors',
          closeButton:
            'toast-close-btn',
        },
      }}
      {...props}
    />
  )
}

export { toast }
