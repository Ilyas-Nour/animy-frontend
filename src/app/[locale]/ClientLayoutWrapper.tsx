'use client'

import { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { Toaster } from 'sonner'
import { MobileNav } from '@/components/layout/MobileNav'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { GuestSignupBanner } from '@/components/auth/SignupPopup'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

// Inner wrapper has access to AuthContext
function InnerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  const hideFooterRoutes = ['/admin', '/chat', '/dashboard', '/profile', '/users']
  const shouldHideFooter = hideFooterRoutes.some(route => pathname?.startsWith(route))

  // Don't show the banner on auth pages
  const isAuthPage = pathname?.includes('/auth/')
  const showBanner = !isLoading && !user && !isAuthPage

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      {!shouldHideFooter && <Footer />}
      {showBanner && <GuestSignupBanner delaySeconds={45} />}
    </div>
  )
}

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1" />
      </div>
    )
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <LazyMotion features={domAnimation}>
            <InnerLayout>{children}</InnerLayout>
            <MobileNav />
            <Toaster position="top-right" richColors />
          </LazyMotion>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  )
}

