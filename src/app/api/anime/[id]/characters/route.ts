import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        const response = await fetch(`${JIKAN_API}/anime/${id}/characters`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            return NextResponse.json({ data: [] })
        }

        const data = await response.json()
        return NextResponse.json({ data: data.data || [] })
    } catch (error: any) {
        console.error('Anime characters error:', error)
        return NextResponse.json({ data: [] })
    }
}
