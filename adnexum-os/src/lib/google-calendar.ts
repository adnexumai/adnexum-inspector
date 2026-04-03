import { google } from 'googleapis';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
];

export function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar/callback`
    );
}

export function getAuthUrl() {
    const oauth2 = getOAuth2Client();
    return oauth2.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });
}

export function getCalendarClient(accessToken: string) {
    const oauth2 = getOAuth2Client();
    oauth2.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth: oauth2 });
}
