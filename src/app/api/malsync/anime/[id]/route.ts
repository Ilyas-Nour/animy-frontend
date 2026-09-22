export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const url = `https://api.malsync.moe/mal/anime/${id}`;
        
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'curl/7.88.1',
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
