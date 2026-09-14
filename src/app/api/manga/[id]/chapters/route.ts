export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const MANGADEX_API = 'https://api.mangadex.org'
const MALSYNC_API = 'https://api.malsync.moe/mal/manga'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        // 1. Fetch MAL-Sync mapping to get MangaDex ID
        const malSyncRes = await fetch(`${MALSYNC_API}/${id}`, {
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
             console.error(`No MangaDex mapping found for MAL ID ${id}`)
             return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
        }

        // Get the first available Mangadex UUID
        const mangadexId = Object.keys(mangadexSites)[0]

        // 2. Fetch English chapters, ordered by chapter number descending
        const response = await fetch(`${MANGADEX_API}/manga/${mangadexId}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=500`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`MangaDex chapters status: ${response.status}`)
            return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
        }

        const json = await response.json()
        
        // Map to expected format
        const chapters = (json.data || []).map((c: any) => ({
            id: c.id,
            title: c.attributes?.title,
            chapterNumber: c.attributes?.chapter,
        }))

        return NextResponse.json({ data: { chapters } })
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('Manga chapters fetch timed out')
        } else {
            console.error('Manga chapters error:', error)
        }
        return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
    }
}
