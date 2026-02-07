import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import axios from 'axios';

const resend = new Resend(process.env.RESEND_API_KEY);

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
            await axios.post(apiUrl, body);
        } catch (err: any) {
            console.error('Backend Sync Error:', err.message);
            return NextResponse.json(
                { message: 'Failed to save message to system.' },
                { status: 500 }
            );
        }

        const data = await resend.emails.send({
            from: 'Contact Form <onboarding@resend.dev>', // Use verified domain in prod or this for testing
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
            replyTo: email,
        });

        if (data.error) {
            return NextResponse.json({ message: data.error.message }, { status: 400 });
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


