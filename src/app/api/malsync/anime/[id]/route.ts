export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    try {
        const url = `https://api.malsync.moe/mal/anime/${id}`;
        
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'AnimyApp/1.0',
                'Accept': 'application/json',
            },
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch from MalSync' }, { status: res.status });
        }

        const data = await res.json();
        
        const response = NextResponse.json(data);
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
