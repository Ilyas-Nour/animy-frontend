export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const MANGADEX_API = 'https://api.mangadex.org'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        // Fetch English chapters, ordered by chapter number descending
        const response = await fetch(`${MANGADEX_API}/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=500`, {
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
