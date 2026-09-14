export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const MANGADEX_API = 'https://api.mangadex.org'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    const { chapterId } = await params

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`MangaDex at-home status: ${response.status}`)
            return NextResponse.json({ error: 'Failed to load chapter' }, { status: response.status })
        }

        const json = await response.json()
        const baseUrl = json.baseUrl
        const hash = json.chapter.hash
        const data = json.chapter.data

        const pages = data.map((filename: string) => `${baseUrl}/data/${hash}/${filename}`)

        return NextResponse.json({ data: { pages } })
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('Manga read fetch timed out')
        } else {
            console.error('Manga read error:', error)
        }
        return NextResponse.json({ error: 'Failed to load chapter' }, { status: 500 })
    }
}
