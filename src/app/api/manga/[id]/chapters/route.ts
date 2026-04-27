export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const response = await fetch(`${BACKEND_API}/manga/${id}/read-chapters`, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        })

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Manga chapters error:', error)
        return NextResponse.json({ error: error.message, data: { chapters: [] } }, { status: 500 })
    }
}
