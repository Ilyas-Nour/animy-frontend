import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const order_by = searchParams.get('order_by') || 'popularity'
    const sort = searchParams.get('sort') || 'desc'
    const limit = searchParams.get('limit') || '25'
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    try {
        let url = `${JIKAN_API}/manga?order_by=${order_by}&sort=${sort}&limit=${limit}`
        if (status) url += `&status=${status}`
        if (type) url += `&type=${type}`

        const response = await fetch(url, {
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
        console.error('Manga search error:', error)
        return NextResponse.json({ error: error.message, data: { data: [] } }, { status: 500 })
    }
}
