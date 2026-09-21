export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const response = await fetch(`${API_URL}/manga/${id}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        })

        if (!response.ok) {
            return NextResponse.json({ success: false, error: 'Failed to fetch manga' }, { status: response.status })
        }

        const data = await response.json()
        const mangaData = data.data || data
        
        return NextResponse.json({ success: true, data: { data: mangaData } }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        })
    } catch (error: any) {
        console.error('Manga detail error:', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
