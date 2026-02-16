import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = 'https://animy-backend.onrender.com/api/v1'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        const response = await fetch(`${JIKAN_API}/manga/${id}/characters`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            return NextResponse.json({ data: [] })
        }

        const data = await response.json()
        return NextResponse.json(data.data)
    } catch (error: any) {
        console.error('Manga characters error:', error)
        return NextResponse.json({ data: [] })
    }
}
