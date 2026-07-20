export const runtime = 'edge';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ilyvs-animy-backend.hf.space/api/v1';

/**
 * Keep-alive ping endpoint.
 * Called by the frontend every 4 minutes to prevent the
 * Hugging Face Spaces free-tier backend from going to sleep.
 */
export async function GET() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${BACKEND_URL}/health`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        }).catch(() => null);

        clearTimeout(timeoutId);

        return NextResponse.json({
            ok: true,
            backendStatus: res?.status ?? 'unreachable',
            ts: Date.now(),
        });
    } catch {
        return NextResponse.json({ ok: false, ts: Date.now() });
    }
}
