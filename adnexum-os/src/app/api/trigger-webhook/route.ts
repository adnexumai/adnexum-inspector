import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const { event, payload } = await request.json();

    if (!event || !payload) {
        return NextResponse.json({ error: 'Missing event or payload' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get active webhooks for this event
    const { data: webhooks, error } = await supabase
        .from('webhook_config')
        .select('*')
        .eq('active', true)
        .contains('events', [event]);

    if (error) {
        console.error('Error fetching webhooks:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!webhooks || webhooks.length === 0) {
        return NextResponse.json({ message: 'No active webhooks found' });
    }

    // Fire and forget (in a real production app, use a queue like Redis/Upstash)
    const promises = webhooks.map(webhook =>
        fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event,
                payload,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error(`Failed to send webhook to ${webhook.url}:`, err))
    );

    // We don't await all promises to keep response fast, but Vercel/Next might kill background tasks.
    // Ideally await Promise.allSettled(promises)
    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, count: webhooks.length });
}
