'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import api from '@/lib/api'
import { toast } from 'sonner'

interface Character {
  mal_id: number
  name: string
  images: {
    jpg: {
      image_url: string
    }
    webp: {
      image_url: string
    }
  }
}

interface CharacterCardProps {
  character: Character
  isFavorited?: boolean
  role?: string
  onToggleFavorite?: (id: number, newState: boolean) => void
}

export function CharacterCard({ character, isFavorited = false, role, onToggleFavorite }: CharacterCardProps) {
  const [favorite, setFavorite] = useState(isFavorited)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setLoading(true)
      const newState = !favorite

      if (newState) {
        await api.post('/users/favorites/characters', {
          characterId: character.mal_id,
          name: character.name,
          imageUrl: character.images?.webp?.image_url || character.images?.jpg?.image_url || '',
          role: role
        })
        toast.success(`${character.name} added to your shrine! ❤️`, {
          description: 'Check your shrine to see all your favorite characters'
        })
      } else {
        await api.delete(`/users/favorites/characters/${character.mal_id}`)
        toast.info(`${character.name} removed from your shrine`, {
          description: 'You can always add them back later'
        })
      }

      setFavorite(newState)

      if (onToggleFavorite) {
        onToggleFavorite(character.mal_id, newState)
      }
    } catch (error: any) {
      console.error('❌ Failed to toggle favorite:', error)
      if (error.response) {
        console.error('Backend Error:', error.response.data)
        const errorMsg = error.response.data?.message?.message || error.response.data?.message || 'Failed to update favorites'
        toast.error('Failed to update favorites', {
          description: errorMsg
        })
      } else if (error.message) {
        toast.error('Network error', {
          description: error.message
        })
      } else {
        toast.error('Network error', {
          description: 'Please check your connection'
        })
      }
      // Don't change state on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-sm hover:shadow-md transition-all h-full"
    >
      <Link href={`/character/${character.mal_id}`} className="block h-full">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {character.images?.jpg?.image_url ? (
            <Image
              src={character.images.webp?.image_url || character.images.jpg.image_url}
              alt={character.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
              No Image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 text-white"
              onClick={handleToggle}
              disabled={loading}
              type="button"
            >
              <motion.div
                whileTap={{ scale: 1.4 }}
                animate={{ scale: favorite ? 1.1 : 1 }}
              >
                <Heart className={cn("h-5 w-5", favorite ? "fill-red-500 text-red-500" : "text-white")} />
              </motion.div>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3 text-white">
          <h3 className="font-bold text-sm md:text-base leading-tight line-clamp-1">{character.name}</h3>
          {role && <p className="text-xs text-white/70">{role}</p>}
        </div>
      </Link>
    </motion.div>
  )
}
