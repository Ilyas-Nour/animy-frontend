import { NextRequest, NextResponse } from 'next/server'

const CONSUMET_API = process.env.CONSUMET_API_URL || 'https://api-consumet-org-iota-flax.vercel.app'

export async function GET(
    request: NextRequest,
    { params }: { params: { episodeId: string } }
) {
    const { episodeId } = params

    if (!episodeId) {
        return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 })
    }

    try {
        const response = await fetch(`${CONSUMET_API}/anime/gogoanime/watch/${episodeId}`)

        if (!response.ok) {
            throw new Error(`Consumet API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Watch error:', error)
        return NextResponse.json({ error: error.message || 'Failed to get streaming links' }, { status: 500 })
    }
}
