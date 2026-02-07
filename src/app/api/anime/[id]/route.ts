import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        const response = await fetch(`${JIKAN_API}/anime/${id}/full`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Anime not found' }, { status: 404 })
            }
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data: data.data })
    } catch (error: any) {
        console.error('Anime detail error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
