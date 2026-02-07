import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${JIKAN_API}/seasons/now?limit=25`, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Current season fetch error:', error)
        return NextResponse.json({ error: error.message, data: { data: [] } }, { status: 500 })
    }
}
