export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server'

// Proxy to Backend API
const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ episodeId: string }> }
) {
    const { episodeId } = await params
    const provider = request.nextUrl.searchParams.get('provider')
    const malId = request.nextUrl.searchParams.get('malId')
    const ep = request.nextUrl.searchParams.get('ep')
    const title = request.nextUrl.searchParams.get('title')

    try {
        // Calculate the frontend proxy URL (Cloudflare Edge)
        const protocol = request.nextUrl.protocol
        const host = request.nextUrl.host
        const frontendProxy = `${protocol}//${host}/api/streaming/proxy`

        // Call backend streaming endpoint
        let queryParams = `?provider=${encodeURIComponent(provider || 'hianime')}`
        if (malId) queryParams += `&malId=${encodeURIComponent(malId)}`
        if (ep) queryParams += `&ep=${encodeURIComponent(ep)}`
        if (title) queryParams += `&title=${encodeURIComponent(title)}`
        queryParams += `&proxyBaseUrl=${encodeURIComponent(frontendProxy)}`

        const url = `${BACKEND_API}/streaming/episode/${encodeURIComponent(episodeId)}${queryParams}`

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        })

        if (!response.ok) {
            throw new Error(`Backend streaming error: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Watch error:', error)
        return NextResponse.json({ error: error.message || 'Failed to get streaming links' }, { status: 500 })
    }
}
