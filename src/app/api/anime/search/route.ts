import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = 'https://api.jikan.moe/v4'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '24'
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const rating = searchParams.get('rating') || ''
    const order_by = searchParams.get('order_by') || 'score'
    const sort = searchParams.get('sort') || 'desc'

    try {
        // Build the URL with proper filtering
        let url = `${JIKAN_API}/anime?page=${page}&limit=${limit}&order_by=${order_by}&sort=${sort}&sfw=true`

        // Add search query if provided
        if (q) url += `&q=${encodeURIComponent(q)}`

        // Add optional filters
        if (type) url += `&type=${type}`
        if (status) url += `&status=${status}`
        if (rating) url += `&rating=${rating}`

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Anime search error:', error)
        return NextResponse.json({ error: error.message, data: { data: [], pagination: {} } }, { status: 500 })
    }
}
