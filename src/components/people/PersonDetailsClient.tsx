'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, User, Heart, Share2, Info, Calendar, MapPin, Briefcase, Settings2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareModal } from '@/components/common/ShareModal'
import { Person } from '@/types/anime'
import Link from 'next/link'

interface PersonDetailsClientProps {
    person: Person
}

export function PersonDetailsClient({ person }: PersonDetailsClientProps) {
    const router = useRouter()

    return (
        <div className="min-h-screen pb-24 md:pb-12">
            {/* Hero Section / Blurred Background */}
            <div className="relative h-[250px] md:h-[400px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                {person.image?.large ? (
                    <Image
                        src={person.image.large}
                        alt={person.name.full}
                        fill
                        className="object-cover opacity-20"
                        priority
                    />
                ) : null}

                <div className="absolute top-8 left-8 z-20">
                    <Button
                        variant="ghost"
                        className="gap-2 bg-background/20 backdrop-blur-md hover:bg-background/40 transition-all border border-white/10"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="container -mt-32 md:-mt-48 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Left Column: Image & Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="max-w-xs mx-auto md:mx-0 relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-background transform transition-transform duration-500 hover:scale-[1.02] aspect-[3/4]">
                                {person.image?.large ? (
                                    <Image
                                        src={person.image.large}
                                        alt={person.name.full}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-secondary">No Image</div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <ShareModal
                                title={person.name.full}
                                description={person.description?.substring(0, 100) || `Checking out ${person.name.full}`}
                                image={person.image?.large}
                                type="PROFILE"
                                id={person.id}
                                path={`/person/${person.id}`}
                                trigger={
                                    <Button variant="secondary" className="w-full h-12 gap-2 font-bold shadow-lg">
                                        <Share2 className="h-4 w-4" />
                                        Share Person
                                    </Button>
                                }
                            />
                        </div>

                        {/* Info Card */}
                        <div className="bg-card/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                Details
                            </h3>
                            <div className="space-y-3">
                                {person.name.native && (
                                    <DetailItem label="Native" value={person.name.native} />
                                )}
                                {person.gender && (
                                    <DetailItem label="Gender" value={person.gender} />
                                )}
                                {person.dateOfBirth && (person.dateOfBirth.year || person.dateOfBirth.month) && (
                                    <DetailItem 
                                        label="Birth" 
                                        value={`${person.dateOfBirth.year || ''}-${person.dateOfBirth.month || ''}-${person.dateOfBirth.day || ''}`.replace(/-+$/, '')} 
                                    />
                                )}
                                {person.homeTown && (
                                    <DetailItem label="Hometown" value={person.homeTown} />
                                )}
                                {person.languageV2 && (
                                    <DetailItem label="Language" value={person.languageV2} />
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Info & Media */}
                    <div className="md:col-span-2 space-y-12">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-4xl md:text-6xl font-black text-foreground drop-shadow-2xl">
                                {person.name.full}
                            </h1>
                            {person.primaryOccupations && person.primaryOccupations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {person.primaryOccupations.map(occ => (
                                        <Badge key={occ} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                                            {occ}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {person.description && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card/30 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl space-y-6"
                            >
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <User className="h-6 w-6 text-primary" />
                                    Biography
                                </h2>
                                <div 
                                    className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line leading-relaxed text-lg selection:bg-primary/30"
                                    dangerouslySetInnerHTML={{ __html: person.description }}
                                />
                            </motion.section>
                        )}

                        {/* Character Roles */}
                        {person.characterMedia && person.characterMedia.edges.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Briefcase className="h-6 w-6 text-primary" />
                                    Character Roles
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {person.characterMedia.edges.map((edge, i) => (
                                        <Link 
                                            key={i} 
                                            href={`/anime/${edge.node.id}`}
                                            className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all h-[80px]"
                                        >
                                            <div className="relative w-14 h-full shrink-0">
                                                <Image
                                                    src={edge.characterNode.image.medium}
                                                    alt={edge.characterNode.name.full}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
                                                <div className="font-bold text-xs truncate">{edge.characterNode.name.full}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{edge.characterRole}</div>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center px-3 text-right min-w-0 border-l border-white/5">
                                                <div className="font-bold text-xs truncate">{edge.node.title.romaji}</div>
                                                <div className="text-[10px] text-primary truncate">View Anime</div>
                                            </div>
                                            <div className="relative w-14 h-full shrink-0">
                                                <Image
                                                    src={edge.node.coverImage.medium}
                                                    alt={edge.node.title.romaji}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Staff Roles */}
                        {person.staffMedia && person.staffMedia.edges.length > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Settings2 className="h-6 w-6 text-primary" />
                                    Staff Roles
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {person.staffMedia.edges.map((edge, i) => (
                                        <Link 
                                            key={i} 
                                            href={`/anime/${edge.node.id}`}
                                            className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all h-[80px]"
                                        >
                                            <div className="relative w-14 h-full shrink-0">
                                                <Image
                                                    src={edge.node.coverImage.medium}
                                                    alt={edge.node.title.romaji}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
                                                <div className="font-bold text-xs truncate">{edge.node.title.romaji}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{edge.staffRole}</div>
                                            </div>
                                            <div className="flex items-center pr-4">
                                                <ArrowLeft className="h-4 w-4 text-primary rotate-180" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-bold text-sm text-right">{value}</span>
        </div>
    )
}
