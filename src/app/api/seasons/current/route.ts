export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    try {
        const response = await fetch(`${API_URL}/anime/schedule?limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Backend seasons/current error: ${response.status}`)
        }

        const data = await response.json()
        let items = []
        if (data.data && Array.isArray(data.data.data)) {
            items = data.data.data
        } else if (Array.isArray(data.data)) {
            items = data.data
        }

        return NextResponse.json(
            { data: items },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                },
            }
        )
    } catch (error: any) {
        console.error('[seasons/current] Backend failed:', error.message)
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
