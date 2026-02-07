'use client'

import { cn } from '@/lib/utils'
import styles from './GlassPrismLogo.module.css'

interface GlassPrismLogoProps {
    className?: string
}

export function GlassPrismLogo({ className }: GlassPrismLogoProps) {
    return (
        <div className={cn(styles.logoContainer, className)}>
            <div className={styles.animaCore}></div>

            <svg className={styles.glassPrism} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="prism-mask">
                        <polygon points="50 5, 95 25, 95 75, 50 95, 5 75, 5 25" fill="none" stroke="white" strokeWidth="3" />
                    </mask>
                </defs>
                <polygon points="50 5, 95 25, 95 75, 50 95, 5 75, 5 25" vectorEffect="non-scaling-stroke" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <line x1="5" y1="25" x2="95" y2="75" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <line x1="95" y1="25" x2="5" y2="75" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            </svg>
        </div>
    )
}
