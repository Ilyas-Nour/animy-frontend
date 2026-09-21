export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    const { chapterId } = await params

    try {
        const response = await fetch(`${API_URL}/manga/read/${chapterId}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        })

        if (!response.ok) {
            console.error(`Backend MangaDex read status: ${response.status}`)
            return NextResponse.json({ error: 'Failed to load chapter' }, { status: response.status })
        }

        const data = await response.json()
        
        // Ensure data format matches what the frontend expects { data: { pages: [...] } }
        const pages = data.data?.pages || data.pages || data.data || []
        
        return NextResponse.json({ data: { pages } })
    } catch (error: any) {
        console.error('Manga read proxy error:', error)
        return NextResponse.json({ error: 'Failed to load chapter' }, { status: 500 })
    }
}
