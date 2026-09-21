export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const response = await fetch(`${API_URL}/manga/${id}/read-chapters`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        })

        if (!response.ok) {
            console.error(`Backend chapters status: ${response.status}`)
            return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
        }

        const data = await response.json()
        
        // Ensure data format matches what the frontend expects
        const chapters = data.data?.chapters || data.chapters || data.data || []
        
        return NextResponse.json(
            { data: { chapters } },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                }
            }
        )
    } catch (error: any) {
        console.error('Manga chapters proxy error:', error)
        return NextResponse.json({ data: { chapters: [] } }, { status: 200 })
    }
}
