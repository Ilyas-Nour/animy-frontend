export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = new URL(request.url);
        const provider = url.searchParams.get('provider') || 'mal';
        const validProvider = ['mal', 'anilist'].includes(provider) ? provider : 'mal';
        
        const response = await fetch(`https://api.malsync.moe/${validProvider}/manga/${id}`, {
            headers: {
                'User-Agent': 'Animy/1.0',
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `MalSync API responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying MalSync request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
