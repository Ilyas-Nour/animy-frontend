'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, Send, CheckCircle, Loader2, MapPin, Phone, Github, Instagram, Twitter } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    try {
      setIsSubmitting(true)
      setError(null)
      // Call the Next.js API route (not the NestJS backend)
      await axios.post('/api/contact', data)
      setIsSuccess(true)
      reset()
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="container max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">

          {/* Left Column: Info & Context */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-8 lg:space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                Let&apos;s Talk.
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                Have a project in mind or just want to chat about anime? We&apos;re all ears. Drop us a line!
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4 text-foreground/80 hover:text-primary transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">Email Us</p>
                  <p className="text-sm text-muted-foreground">eliasnoureislam@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-foreground/80 hover:text-primary transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Available 24/7 for premium members</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-foreground/80 hover:text-primary transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold">HQ</p>
                  <p className="text-sm text-muted-foreground">Akihabara, Tokyo, Japan</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              {[Twitter, Github, Instagram].map((Icon, i) => (
                <Button key={i} size="icon" variant="outline" className="rounded-full h-12 w-12 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Glass Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-3xl blur-2xl opacity-20 transform rotate-2" />
            <div className="relative bg-card/50 backdrop-blur-xl border border-white/10 dark:border-white/5 p-8 md:p-10 rounded-3xl shadow-2xl">

              {/* Success Overlay */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-3xl text-center p-8"
                  >
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-green-500/10 p-4 rounded-full mb-4"
                    >
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-foreground mb-2">Received!</h3>
                    <p className="text-muted-foreground mb-6">We&apos;ll get back to you shortly.</p>
                    <Button onClick={() => setIsSuccess(false)} variant="outline">
                      Send Another
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-8">
                <h2 className="text-2xl font-bold">Send a Message</h2>
                <p className="text-muted-foreground">We usually respond within 24 hours.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Name</Label>
                    <Input
                      {...register('name')}
                      className="bg-background/20 border-white/10 focus:border-primary/50 h-12 rounded-xl transition-all"
                      placeholder="Name"
                      disabled={isSubmitting}
                    />
                    {errors.name && <p className="text-xs text-red-500 pl-1">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Email</Label>
                    <Input
                      {...register('email')}
                      className="bg-background/20 border-white/10 focus:border-primary/50 h-12 rounded-xl transition-all"
                      placeholder="hello@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && <p className="text-xs text-red-500 pl-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Subject</Label>
                  <Input
                    {...register('subject')}
                    className="bg-background/20 border-white/10 focus:border-primary/50 h-12 rounded-xl transition-all"
                    placeholder="Project Inquiry"
                    disabled={isSubmitting}
                  />
                  {errors.subject && <p className="text-xs text-red-500 pl-1">{errors.subject.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pl-1">Message</Label>
                  <Textarea
                    {...register('message')}
                    className="bg-background/20 border-white/10 focus:border-primary/50 min-h-[150px] rounded-xl resize-none transition-all p-4"
                    placeholder="Tell us everything..."
                    disabled={isSubmitting}
                  />
                  {errors.message && <p className="text-xs text-red-500 pl-1">{errors.message.message}</p>}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'SendMessage'} <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}