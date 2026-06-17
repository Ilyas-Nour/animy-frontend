'use client'

import { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { Toaster } from 'sonner'
import { MobileNav } from '@/components/layout/MobileNav'
import { LazyMotion, domAnimation } from 'framer-motion'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Routes where the footer should be hidden
  const hideFooterRoutes = ['/admin', '/chat', '/dashboard', '/profile', '/users']
  const shouldHideFooter = hideFooterRoutes.some(route => pathname?.startsWith(route))

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
        <LazyMotion features={domAnimation}>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            {!shouldHideFooter && <Footer />}
          </div>
          <MobileNav />
          <Toaster position="top-right" richColors />
        </LazyMotion>
      </SocketProvider>
    </AuthProvider>
  )
}
