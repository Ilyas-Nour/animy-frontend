import { NextRequest, NextResponse } from 'next/server'

const CONSUMET_API = process.env.CONSUMET_API_URL || 'https://api-consumet-org-iota-flax.vercel.app'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    if (!id) {
        return NextResponse.json({ error: 'Anime ID is required' }, { status: 400 })
    }

    try {
        const response = await fetch(`${CONSUMET_API}/anime/gogoanime/info/${id}`)

        if (!response.ok) {
            throw new Error(`Consumet API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Info error:', error)
        return NextResponse.json({ error: error.message || 'Failed to get anime info' }, { status: 500 })
    }
}
