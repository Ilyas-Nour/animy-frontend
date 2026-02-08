'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const NOTIF_BASE_VOLUME = 0.4
const SENT_BASE_VOLUME = 0.3

export const useChatSounds = () => {
    const [isMuted, setIsMuted] = useState<boolean>(false)
    const [globalVolume, setGlobalVolume] = useState<number>(1.0) // 0.0 to 1.0

    const notifAudio = useRef<HTMLAudioElement | null>(null)
    const sentAudio = useRef<HTMLAudioElement | null>(null)
    const isUnlocked = useRef(false)

    // Initialize state from localStorage after mount
    useEffect(() => {
        const savedMute = localStorage.getItem('chat_muted')
        if (savedMute === 'true') {
            setIsMuted(true)
        }

        const savedVolume = localStorage.getItem('chat_volume')
        if (savedVolume !== null) {
            setGlobalVolume(parseFloat(savedVolume))
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            notifAudio.current = new Audio('/sounds/notif1.mp3')
            sentAudio.current = new Audio('/sounds/sent1.mp3')

            // Set initial volumes - Handled by the dedicated volume effect
            // if (notifAudio.current) notifAudio.current.volume = NOTIF_BASE_VOLUME * globalVolume
            // if (sentAudio.current) sentAudio.current.volume = SENT_BASE_VOLUME * globalVolume

            const unlock = () => {
                if (isUnlocked.current) return

                // Play and pause immediately to unlock audio context for some browsers
                const p1 = notifAudio.current?.play()
                if (p1) {
                    p1.then(() => {
                        notifAudio.current?.pause()
                        notifAudio.current!.currentTime = 0
                    }).catch(() => { })
                }

                const p2 = sentAudio.current?.play()
                if (p2) {
                    p2.then(() => {
                        sentAudio.current?.pause()
                        sentAudio.current!.currentTime = 0
                    }).catch(() => { })
                }

                isUnlocked.current = true
                window.removeEventListener('click', unlock)
                window.removeEventListener('keydown', unlock)
            }

            window.addEventListener('click', unlock)
            window.addEventListener('keydown', unlock)
            return () => {
                window.removeEventListener('click', unlock)
                window.removeEventListener('keydown', unlock)
            }
        }
    }, [])

    // Update volumes when globalVolume changes
    useEffect(() => {
        if (notifAudio.current) notifAudio.current.volume = NOTIF_BASE_VOLUME * globalVolume
        if (sentAudio.current) sentAudio.current.volume = SENT_BASE_VOLUME * globalVolume
        localStorage.setItem('chat_volume', String(globalVolume))
    }, [globalVolume])

    // Track mute state
    useEffect(() => {
        localStorage.setItem('chat_muted', String(isMuted))
    }, [isMuted])

    // Update global volume storage
    useEffect(() => {
        localStorage.setItem('chat_volume', String(globalVolume))
    }, [globalVolume])

    const playSound = useCallback((url: string) => {
        if (!isMuted && typeof window !== 'undefined') {
            try {
                const audio = new Audio(url)
                audio.volume = (url.includes('notif') ? NOTIF_BASE_VOLUME : SENT_BASE_VOLUME) * globalVolume
                const promise = audio.play()

                if (promise !== undefined) {
                    promise.catch(error => {
                        console.error('Audio playback failed:', error)
                    })
                }
            } catch (err) {
                console.error('Audio creation failed:', err)
            }
        }
    }, [isMuted, globalVolume])

    const playNotif = useCallback(() => {
        playSound('/sounds/notif1.mp3')
    }, [playSound])

    const playSent = useCallback(() => {
        playSound('/sounds/sent1.mp3')
    }, [playSound])

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev)
    }, [])

    const setVolume = useCallback((val: number) => {
        setGlobalVolume(val)
    }, [])

    return { isMuted, toggleMute, playNotif, playSent, globalVolume, setVolume }
}
