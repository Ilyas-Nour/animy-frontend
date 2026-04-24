export const runtime = 'edge';
import { NextResponse } from 'next/server';


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        // Basic server-side validation
        if (!name || !email || !message) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Sync with Backend
        try {
            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1') + '/contact';
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (err: any) {
            console.error('Backend Sync Error:', err.message);
            // Continue even if backend sync fails - email is priority
        }

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn('Resend API key not configured');
            return NextResponse.json({ message: 'Message received but email service not configured' });
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Contact Form <onboarding@resend.dev>',
                to: 'eliasnourelislam@gmail.com',
                subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
                html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Message from ${name}</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
                reply_to: email,
            })
        });

        const data = await resendResponse.json();

        if (!resendResponse.ok) {
            return NextResponse.json({ message: data.message || 'Error sending email' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Email sent successfully', data });
    } catch (error: any) {
        console.error('Contact API Error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
