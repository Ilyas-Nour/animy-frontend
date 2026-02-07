'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { MoveLeft, Home, Sparkles, Orbit, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const charRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const codeRef = useRef<HTMLHeadingElement>(null)
    const cursorRef = useRef<HTMLDivElement>(null)
    const cursorDotRef = useRef<HTMLDivElement>(null)
    const magneticBtnBack = useRef<HTMLDivElement>(null)
    const magneticBtnHome = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
        const ctx = gsap.context(() => {
            // 1. Custom Cursor Follower
            const moveCursor = (e: MouseEvent) => {
                gsap.to(cursorRef.current, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.6,
                    ease: 'power3.out'
                })
                gsap.to(cursorDotRef.current, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.1
                })
            }

            // 2. Parallax Multi-layer
            const handleMouseMove = (e: MouseEvent) => {
                const { clientX, clientY } = e
                const xPos = (clientX / window.innerWidth - 0.5)
                const yPos = (clientY / window.innerHeight - 0.5)

                // Character Parallax (Reactive)
                gsap.to(charRef.current, {
                    x: xPos * 70,
                    y: yPos * 70 - 20,
                    rotateY: xPos * 25,
                    rotateX: -yPos * 25,
                    duration: 1.2,
                    ease: 'power2.out'
                })

                // Background Text Parallax (Deep Inverted)
                gsap.to(codeRef.current, {
                    x: -xPos * 120,
                    y: -yPos * 120,
                    duration: 2,
                    ease: 'power2.out'
                })

                // Debris / Particles Parallax
                gsap.to('.debris', {
                    x: (i) => -xPos * (40 * (i + 1)),
                    y: (i) => -yPos * (40 * (i + 1)),
                    duration: 2.5,
                    stagger: 0.05,
                    ease: 'power1.out'
                })
            }

            // 3. Magnetic Button Logic
            const setMagnetic = (btn: HTMLDivElement | null) => {
                if (!btn) return
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect()
                    const x = e.clientX - rect.left - rect.width / 2
                    const y = e.clientY - rect.top - rect.height / 2
                    gsap.to(btn, {
                        x: x * 0.45,
                        y: y * 0.45,
                        scale: 1.05,
                        duration: 0.4,
                        ease: 'power2.out'
                    })
                })
                btn.addEventListener('mouseleave', () => {
                    gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)' })
                })
            }

            window.addEventListener('mousemove', moveCursor)
            window.addEventListener('mousemove', handleMouseMove)
            setMagnetic(magneticBtnBack.current)
            setMagnetic(magneticBtnHome.current)

            // 4. Glitch Timeline for 404 Code
            const glitchTl = gsap.timeline({ repeat: -1, repeatDelay: 4 })
            glitchTl
                .to(codeRef.current, { skewX: 25, duration: 0.08, color: '#ff2d55', opacity: 0.1, x: '+=10' })
                .to(codeRef.current, { skewX: -25, duration: 0.08, color: '#007aff', opacity: 0.1, x: '-=20' })
                .to(codeRef.current, { skewX: 0, duration: 0.1, color: 'rgba(255,255,255,0.03)', opacity: 1, x: 0 })

            // 5. Entrance Sequence
            const mainTl = gsap.timeline()
            mainTl
                .from(containerRef.current, { opacity: 0, duration: 1 })
                .from(codeRef.current, { opacity: 0, scale: 0.8, y: 50, duration: 1.5, ease: 'expo.out' }, '-=0.5')
                .from(charRef.current, { opacity: 0, scale: 0.5, y: 100, duration: 1.2, ease: 'back.out(1.7)' }, '-=1')
                .from('.stagger-item', { opacity: 0, y: 30, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.5')

            return () => {
                window.removeEventListener('mousemove', moveCursor)
                window.removeEventListener('mousemove', handleMouseMove)
            }
        }, containerRef)

        return () => ctx.revert()
    }, [])

    if (!mounted) return null

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen bg-[#030305] flex flex-col items-center justify-center overflow-hidden cursor-none"
        >
            {/* 🚀 Advanced Custom Cursor */}
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-12 h-12 border border-primary/40 rounded-full pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2 mix-blend-screen hidden md:flex items-center justify-center overflow-hidden"
            >
                <Compass className="w-4 h-4 text-primary opacity-30 animate-spin-slow" />
            </div>
            <div
                ref={cursorDotRef}
                className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[101] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(var(--primary),0.8)] hidden md:block"
            />

            {/* 🌌 Atmospheric Layers */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] bg-primary/10 rounded-full blur-[180px] opacity-40 animate-pulse" />
                <div className="absolute top-[10%] right-[10%] w-[30vw] h-[30vw] bg-blue-600/5 rounded-full blur-[140px]" />
                <div className="absolute bottom-[10%] left-[10%] w-[35vw] h-[35vw] bg-purple-600/5 rounded-full blur-[140px]" />

                {/* CRT / Scanline Digital Overlay */}
                <div className="absolute inset-0 bg-404-grid z-50 pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.02),rgba(0,0,255,0.04))] z-50 pointer-events-none bg-[length:100%_3px,4px_100%]" />
            </div>

            {/* ✨ Floating Debris / Particles */}
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="debris absolute pointer-events-none text-white/5 select-none"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        fontSize: `${Math.random() * 24 + 8}px`
                    }}
                >
                    {i % 4 === 0 ? <Sparkles className="w-5 h-5" /> : i % 4 === 1 ? <Orbit className="w-4 h-4" /> : i % 4 === 2 ? <Compass className="w-3 h-3" /> : '•'}
                </div>
            ))}

            {/* 🧩 404 Massive Background Code */}
            <h1
                ref={codeRef}
                className="text-[10rem] md:text-[25rem] font-black text-white/[0.02] select-none absolute z-0 leading-none tracking-tighter"
            >
                404
            </h1>

            {/* 💎 Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-5xl px-6 py-4 h-full justify-center">
                {/* Main Character Showcase */}
                <div
                    ref={charRef}
                    className="relative w-56 h-56 md:w-[400px] md:h-[400px] mb-4 md:mb-8 select-none group perspective-1000 animate-character-glitch shrink-0"
                >
                    <div className="absolute inset-x-0 bottom-6 h-12 bg-primary/30 rounded-[100%] blur-[60px] transition-all duration-1000 group-hover:bg-primary/50" />
                    <Image
                        src="/404-character.png"
                        alt="Lost Spirit"
                        fill
                        className="object-contain drop-shadow-[0_0_40px_rgba(var(--primary),0.5)] scale-110 group-hover:scale-125 transition-all duration-700 ease-out"
                        priority
                    />
                </div>

                {/* Messaging Area */}
                <div ref={textRef} className="space-y-4 md:space-y-6">
                    <div className="stagger-item">
                        <span className="inline-flex items-center gap-2 py-1 px-3 bg-primary/10 border border-primary/20 rounded-full text-[9px] uppercase tracking-[0.4em] font-black text-primary mb-2 backdrop-blur-md">
                            <Compass className="w-3 h-3 animate-pulse" /> ERROR_X09
                        </span>
                    </div>

                    <h2 className="stagger-item text-3xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
                        WE ARE <br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-500">BEYOND REACH</span>
                    </h2>

                    <p className="stagger-item text-slate-400 text-base md:text-xl font-bold max-w-xl mx-auto leading-relaxed italic opacity-80">
                        &ldquo;oops, maybe we are lost...&rdquo; <br />
                        <span className="text-[10px] md:text-sm not-italic font-medium text-slate-500">The path you seek has been folded into another reality.</span>
                    </p>

                    {/* Action Hub */}
                    <div className="stagger-item flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 mt-6 md:mt-10">
                        <div ref={magneticBtnBack} className="w-full sm:w-auto">
                            <Button
                                onClick={() => router.back()}
                                variant="ghost"
                                size="lg"
                                className="group h-12 md:h-16 w-full sm:px-12 rounded-2xl md:rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.1] text-white font-black uppercase tracking-widest text-[10px] gap-4 transition-all backdrop-blur-xl shadow-2xl overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <MoveLeft className="w-4 h-4 text-primary group-hover:-translate-x-2 transition-transform" />
                                Go Back
                            </Button>
                        </div>

                        <div ref={magneticBtnHome} className="w-full sm:w-auto">
                            <Link href="/">
                                <Button
                                    size="lg"
                                    className="group h-12 md:h-16 w-full sm:px-12 rounded-2xl md:rounded-3xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] gap-4 shadow-[0_20px_60px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.03] active:scale-95"
                                >
                                    <Home className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                    Signal Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🌌 Dynamic Starfield Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50">
                {[...Array(40)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-float"
                        style={{
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.6,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 7}s`
                        }}
                    />
                ))}
            </div>

            <style jsx global>{`
        .bg-404-grid {
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: center center;
          opacity: 0.5;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-40px) scale(1.2); opacity: 0.8; }
        }
        .animate-float {
          animation: float linear infinite;
        }
        @keyframes character-glitch {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 60px rgba(var(--primary), 0.5)); }
          95% { filter: brightness(1) drop-shadow(0 0 60px rgba(var(--primary), 0.5)); }
          96% { filter: brightness(1.5) drop-shadow(0 0 80px rgba(var(--primary), 0.8)); }
          97% { filter: brightness(0.8) drop-shadow(0 0 40px rgba(var(--primary), 0.3)); }
          98% { filter: brightness(2) drop-shadow(0 0 100px rgba(var(--primary), 1)); }
          99% { filter: brightness(1) drop-shadow(0 0 60px rgba(var(--primary), 0.5)); }
        }
        .animate-character-glitch {
          animation: character-glitch 5s step-end infinite;
        }
      `}</style>
        </div>
    )
}
