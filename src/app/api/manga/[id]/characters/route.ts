export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    
    try {
        const response = await fetch(`${API_URL}/manga/${id}/characters`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        })
        
        if (!response.ok) {
            return NextResponse.json({ data: [] }, { status: 200 })
        }
        
        const data = await response.json()
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        })
    } catch (error) {
        console.error('Manga characters error:', error)
        return NextResponse.json({ data: [] }, { status: 200 })
    }
}
