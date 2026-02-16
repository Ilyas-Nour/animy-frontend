import { NextRequest, NextResponse } from 'next/server'

const JIKAN_API = 'https://animy-backend.onrender.com/api/v1'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const order_by = searchParams.get('order_by') || 'popularity'
    const sort = searchParams.get('sort') || 'desc'
    const limit = searchParams.get('limit') || '25'
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    try {
        // The provided "Code Edit" snippet is syntactically incorrect and introduces undefined variables.
        // It appears to be an attempt to change the URL construction and introduce new parameters like 'q' and 'page'.
        // To make a syntactically correct change based on the provided snippet,
        // I will interpret it as replacing the original URL construction with a new one,
        // assuming 'query', 'orderBy', and 'page' are intended to be extracted from searchParams,
        // and correcting the 'leconst response' typo.

        const query = searchParams.get('q') || '' // Assuming 'q' is the new query parameter
        const page = searchParams.get('page') || '1' // Assuming 'page' is the new page parameter
        const orderBy = searchParams.get('order_by') || 'popularity' // Re-using order_by as orderBy for consistency with snippet

        let url = `${JIKAN_API}/manga?q=${query}&type=${type}&status=${status}&order_by=${orderBy}&sort=${sort}&limit=${limit}&page=${page}`

        // The original conditional appends are now integrated into the main URL string.
        // The snippet also contained redundant `if (status) url += ...` lines and a duplicate fetch call.
        // I will remove the redundant lines and ensure only one fetch call is made with the new URL.

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
        return NextResponse.json(data.data)
    } catch (error: any) {
        console.error('Manga search error:', error)
        return NextResponse.json({ error: error.message, data: { data: [] } }, { status: 500 })
    }
}
