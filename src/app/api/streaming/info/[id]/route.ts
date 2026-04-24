import { NextRequest, NextResponse } from 'next/server'

// Use our Backend
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        // Call backend streaming info endpoint
        // ID might need encoding if it contains slashes (though usually handled by params)
        // For AnimePahe IDs or similar, they are usually safe strings
        const response = await fetch(`${BACKEND_API}/streaming/anime/${encodeURIComponent(id)}`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 }
        })

        if (!response.ok) {
            throw new Error(`Backend streaming info error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json({ data }) // Wrap in data object
    } catch (error: any) {
        console.error('Info error:', error)
        return NextResponse.json({ error: error.message || 'Failed to load info' }, { status: 500 })
    }
}
