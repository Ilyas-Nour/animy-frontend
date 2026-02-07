'use client'

import Link from 'next/link'
import { ChevronLeft, Newspaper } from 'lucide-react'

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="container max-w-4xl mx-auto text-center">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
                    </Link>
                </div>

                <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Newspaper className="h-10 w-10 text-primary" />
                </div>

                <h1 className="text-4xl font-black mb-4">Blog</h1>
                <p className="text-muted-foreground text-lg mb-8">
                    Coming soon! Stay tuned for anime news, reviews, and updates.
                </p>

                <Link href="/news" className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity">
                    Check out News instead
                </Link>
            </div>
        </div>
    )
}
