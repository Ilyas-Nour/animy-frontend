'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Tv, Library, Heart, ArrowRight, Check } from 'lucide-react'

// Define the steps for the onboarding wizard
const steps = [
    {
        id: 'welcome',
        title: 'Welcome to Animy',
        description: 'Your ultimate destination for everything Anime and Manga.',
        icon: <Sparkles className="w-16 h-16 text-primary" />,
        color: 'bg-primary/10 text-primary'
    },
    {
        id: 'discover',
        title: 'Discover Content',
        description: 'Browse through thousands of anime series, movies, and manga chapters updated daily.',
        icon: <Tv className="w-16 h-16 text-purple-500" />,
        color: 'bg-purple-500/10 text-purple-500'
    },
    {
        id: 'track',
        title: 'Track Progress',
        description: 'Never lose your spot. Automatically track episodes watched and chapters read.',
        icon: <Library className="w-16 h-16 text-pink-500" />,
        color: 'bg-pink-500/10 text-pink-500'
    },
    {
        id: 'favorites',
        title: 'Build Your Collection',
        description: 'Save your favorites and create personalized watchlists to share with friends.',
        icon: <Heart className="w-16 h-16 text-red-500" />,
        color: 'bg-red-500/10 text-red-500'
    }
]

export function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeen = localStorage.getItem('animy_onboarding_completed')

        // Use a small timeout to let the page load before showing the modal
        // Ideally checking if user is logged in would be better, but doing it clientside for now
        // is safer to catch all "new" sessions on this device.
        if (!hasSeen) {
            const timer = setTimeout(() => setIsOpen(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleFinish()
        }
    }

    const handleFinish = () => {
        setIsOpen(false)
        localStorage.setItem('animy_onboarding_completed', 'true')
    }

    const step = steps[currentStep]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            // Only allow closing if finished or explicitly dismissed (optional)
            if (!open) handleFinish()
            setIsOpen(open)
        }}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
                <div className="relative h-[450px] flex flex-col bg-background">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                    {/* Progress Bar */}
                    <div className="flex gap-1 p-6 z-10">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${idx <= currentStep ? 'bg-primary' : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${step.color} shadow-lg`}
                                >
                                    {step.icon}
                                </motion.div>
                                <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer / Controls */}
                    <div className="p-6 bg-muted/30 flex items-center justify-between mt-auto">
                        <Button
                            variant="ghost"
                            onClick={handleFinish}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="gap-2 min-w-[140px]"
                        >
                            {currentStep === steps.length - 1 ? (
                                <>
                                    Get Started <Check className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Next <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
