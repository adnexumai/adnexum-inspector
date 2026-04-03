import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOAuth2Client, getCalendarClient } from '@/lib/google-calendar';

// Refresh token if expired
async function getValidAccessToken(supabase: any, userId: string) {
    const { data: tokenData, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !tokenData) return null;

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    // If token is still valid, return it
    if (expiresAt > now) {
        return tokenData.access_token;
    }

    // Refresh the token
    try {
        const oauth2 = getOAuth2Client();
        oauth2.setCredentials({ refresh_token: tokenData.refresh_token });
        const { credentials } = await oauth2.refreshAccessToken();

        // Update in Supabase
        const newExpiry = new Date(credentials.expiry_date || Date.now() + 3600 * 1000).toISOString();
        await supabase
            .from('google_calendar_tokens')
            .update({
                access_token: credentials.access_token,
                expires_at: newExpiry,
            })
            .eq('user_id', userId);

        return credentials.access_token;
    } catch (err) {
        console.error('Failed to refresh Google token:', err);
        // Delete invalid tokens so user can re-connect
        await supabase.from('google_calendar_tokens').delete().eq('user_id', userId);
        return null;
    }
}

// GET /api/google-calendar/events?timeMin=...&timeMax=...
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(supabase, user.id);
    if (!accessToken) {
        return NextResponse.json({ connected: false, events: [] });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 30 * 86400000).toISOString();

    try {
        const calendar = getCalendarClient(accessToken);
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100,
        });

        const events = (response.data.items || []).map(event => ({
            id: event.id,
            title: event.summary || 'Sin título',
            description: event.description || '',
            start: event.start?.dateTime || event.start?.date || '',
            end: event.end?.dateTime || event.end?.date || '',
            location: event.location || '',
            htmlLink: event.htmlLink || '',
            isAllDay: !event.start?.dateTime,
        }));

        return NextResponse.json({ connected: true, events });
    } catch (err: any) {
        console.error('Error fetching Google Calendar events:', err);
        if (err.code === 401) {
            // Token is invalid, clean up
            await supabase.from('google_calendar_tokens').delete().eq('user_id', user.id);
            return NextResponse.json({ connected: false, events: [] });
        }
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

// POST /api/google-calendar/events — Create a new event
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(supabase, user.id);
    if (!accessToken) {
        return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const calendar = getCalendarClient(accessToken);

        const event = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: body.title,
                description: body.description || '',
                start: {
                    dateTime: body.start,
                    timeZone: body.timeZone || 'America/Argentina/Buenos_Aires',
                },
                end: {
                    dateTime: body.end,
                    timeZone: body.timeZone || 'America/Argentina/Buenos_Aires',
                },
                location: body.location || '',
            },
        });

        return NextResponse.json({ success: true, event: event.data });
    } catch (err) {
        console.error('Error creating Google Calendar event:', err);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
