import { NextRequest, NextResponse } from 'next/server'

// Use a working Consumet API instance with Zoro provider
const CONSUMET_API = process.env.CONSUMET_API_URL || 'https://consumet-api-clone.vercel.app'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        // Use Zoro provider for anime info
        const response = await fetch(`${CONSUMET_API}/anime/zoro/info?id=${encodeURIComponent(id)}`, {
            headers: { 'Accept': 'application/json' },
        })

        if (!response.ok) {
            throw new Error(`Consumet API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Info error:', error)
        return NextResponse.json({ error: error.message || 'Failed to get info' }, { status: 500 })
    }
}
