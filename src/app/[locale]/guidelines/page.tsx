'use client'

import Link from 'next/link'
import { ChevronLeft, Shield } from 'lucide-react'

export default function GuidelinesPage() {
    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="container max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
                    </Link>
                </div>

                <div className="text-center mb-12">
                    <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Shield className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black mb-4">Community Guidelines</h1>
                    <p className="text-muted-foreground">Last updated: February 2026</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8">
                    <section className="bg-card/50 border border-border rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4">1. Be Respectful</h2>
                        <p className="text-muted-foreground">
                            Treat all community members with respect. No harassment, hate speech, discrimination, or personal attacks will be tolerated.
                        </p>
                    </section>

                    <section className="bg-card/50 border border-border rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4">2. Keep It Appropriate</h2>
                        <p className="text-muted-foreground">
                            No explicit, NSFW, or inappropriate content. Keep discussions family-friendly and suitable for all ages.
                        </p>
                    </section>

                    <section className="bg-card/50 border border-border rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4">3. No Spam</h2>
                        <p className="text-muted-foreground">
                            Avoid spamming, excessive self-promotion, or repetitive content. Quality over quantity.
                        </p>
                    </section>

                    <section className="bg-card/50 border border-border rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4">4. Respect Privacy</h2>
                        <p className="text-muted-foreground">
                            Do not share personal information of others without their consent. Protect your own privacy as well.
                        </p>
                    </section>

                    <section className="bg-card/50 border border-border rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4">5. Have Fun!</h2>
                        <p className="text-muted-foreground">
                            Animy is a place to enjoy anime and manga. Share your passion, make friends, and enjoy the community!
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
