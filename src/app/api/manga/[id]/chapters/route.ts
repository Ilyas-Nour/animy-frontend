export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'
import { anilistFetch } from '@/lib/anilist-client'

const MANGADEX_API = 'https://api.mangadex.org'
const MALSYNC_API = 'https://api.malsync.moe/mal/manga'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        // 1. Fetch AniList to get the MAL ID (idMal)
        const anilistQuery = `query($id: Int) { Media(id: $id, type: MANGA) { idMal } }`
        const anilistData = await anilistFetch(anilistQuery, { id: parseInt(id, 10) })
        const malId = anilistData?.Media?.idMal
        
        if (!malId) {
            console.error(`No MAL ID found for AniList ID ${id}`)
            return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
        }

        // 2. Fetch MAL-Sync mapping to get MangaDex ID
        const malSyncRes = await fetch(`${MALSYNC_API}/${malId}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            signal: controller.signal
        })

        if (!malSyncRes.ok) {
            console.error(`MAL-Sync status: ${malSyncRes.status}`)
            return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
        }

        const malSyncJson = await malSyncRes.json()
        const mangadexSites = malSyncJson?.Sites?.Mangadex
        if (!mangadexSites) {
             console.error(`No MangaDex mapping found for MAL ID ${malId}`)
             return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
        }

        // Get the first available Mangadex UUID
        const mangadexId = Object.keys(mangadexSites)[0]

        // 3. Fetch English chapters, ordered by chapter number descending (fetch up to 500)
        // We paginate to get all chapters, not just the first 500
        let allChapters: any[] = []
        let offset = 0
        const pageLimit = 500
        let hasMore = true

        while (hasMore && offset < 2000) { // Cap at 2000 chapters total
            const url = `${MANGADEX_API}/manga/${mangadexId}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=${pageLimit}&offset=${offset}&includes[]=scanlation_group`
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                signal: controller.signal
            })

            if (!response.ok) {
                console.error(`MangaDex chapters status: ${response.status}`)
                break
            }

            const json = await response.json()
            const batch = json.data || []
            allChapters = allChapters.concat(batch)
            
            // Check if there are more
            const total = json.total || 0
            offset += pageLimit
            hasMore = batch.length === pageLimit && allChapters.length < total
        }

        clearTimeout(timeoutId)

        // 4. Deduplicate by chapter number — keep one per chapter number
        // Prefer: official scanlation groups, then most recently uploaded
        const chapterMap = new Map<string, any>()
        
        for (const c of allChapters) {
            const chNum = c.attributes?.chapter ?? 'oneshot'
            const key = String(chNum)
            
            if (!chapterMap.has(key)) {
                chapterMap.set(key, c)
            } else {
                const existing = chapterMap.get(key)
                // Prefer the one with a title over one without
                const existingHasTitle = !!existing.attributes?.title
                const newHasTitle = !!c.attributes?.title
                // Prefer official (scanlation group with "official" in name)
                const newIsOfficial = c.relationships?.some((r: any) => 
                    r.type === 'scanlation_group' && 
                    r.attributes?.name?.toLowerCase().includes('official')
                )
                const existingIsOfficial = existing.relationships?.some((r: any) => 
                    r.type === 'scanlation_group' && 
                    r.attributes?.name?.toLowerCase().includes('official')
                )
                // Replace if new is official and existing isn't, or both equal and new has title
                if ((newIsOfficial && !existingIsOfficial) || (!existingHasTitle && newHasTitle)) {
                    chapterMap.set(key, c)
                }
            }
        }

        // 5. Sort by chapter number descending (latest first)
        const deduplicated = Array.from(chapterMap.values()).sort((a, b) => {
            const aNum = parseFloat(a.attributes?.chapter ?? '0') || 0
            const bNum = parseFloat(b.attributes?.chapter ?? '0') || 0
            return bNum - aNum
        })
        
        // Map to expected format
        const chapters = deduplicated.map((c: any) => ({
            id: c.id,
            title: c.attributes?.title || null,
            chapterNumber: c.attributes?.chapter,
            pages: c.attributes?.pages,
            publishedAt: c.attributes?.publishAt,
            scanlationGroup: c.relationships?.find((r: any) => r.type === 'scanlation_group')?.attributes?.name
        }))

        return NextResponse.json(
            { data: { chapters } },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                }
            }
        )
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('Manga chapters fetch timed out')
        } else {
            console.error('Manga chapters error:', error)
        }
        return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
    }
}
