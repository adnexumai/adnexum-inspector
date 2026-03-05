import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

        if (!webhookUrl) {
            return NextResponse.json(
                { error: 'Webhook URL not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // If n8n returns 200, we return 200. Even if body is empty.
        // n8n often returns plain text or JSON.
        const contentType = response.headers.get('content-type');

        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text };
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: 'n8n error', details: data },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
