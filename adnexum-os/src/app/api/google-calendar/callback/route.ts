import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(`${origin}/calendario?gcal_error=access_denied`);
    }

    try {
        // Exchange code for tokens
        const oauth2 = getOAuth2Client();
        const { tokens } = await oauth2.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token) {
            return NextResponse.redirect(`${origin}/calendario?gcal_error=no_tokens`);
        }

        // Get Supabase user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(`${origin}/login`);
        }

        // Calculate expiry
        const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000).toISOString();

        // Upsert tokens in Supabase
        const { error: dbError } = await supabase
            .from('google_calendar_tokens')
            .upsert({
                user_id: user.id,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt,
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('Error saving Google tokens:', dbError);
            return NextResponse.redirect(`${origin}/calendario?gcal_error=db_error`);
        }

        return NextResponse.redirect(`${origin}/calendario?gcal_connected=true`);
    } catch (err) {
        console.error('Google Calendar callback error:', err);
        return NextResponse.redirect(`${origin}/calendario?gcal_error=exchange_failed`);
    }
}
