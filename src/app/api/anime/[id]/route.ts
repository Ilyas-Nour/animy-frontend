import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        const response = await fetch(`${BACKEND_API}/anime/${id}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 } // Always fresh for details
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Anime not found' }, { status: 404 })
            }
            throw new Error(`Backend API error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data: data.data })
    } catch (error: any) {
        console.error('Anime detail error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
