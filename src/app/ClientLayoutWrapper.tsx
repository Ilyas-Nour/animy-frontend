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

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Routes where the footer should be hidden
  const hideFooterRoutes = ['/admin', '/chat', '/dashboard', '/profile', '/users']
  const shouldHideFooter = hideFooterRoutes.some(route => pathname?.startsWith(route))

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
