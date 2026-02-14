'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GoogleCalendarEvent {
    id: string;
    title: string;
    description: string;
    start: string;
    end: string;
    location: string;
    htmlLink: string;
    isAllDay: boolean;
}

export function useGoogleCalendar(timeMin?: string, timeMax?: string) {
    const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            // Use provided times or default to current month
            const start = timeMin || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const end = timeMax || new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString();

            params.set('timeMin', start);
            params.set('timeMax', end);

            const res = await fetch(`/api/google-calendar/events?${params}`);
            const data = await res.json();

            setConnected(data.connected ?? false);
            setEvents(data.events ?? []);
        } catch (err) {
            console.error('Error fetching Google Calendar:', err);
            setConnected(false);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [timeMin, timeMax]);

    useEffect(() => {
        let mounted = true;
        fetchEvents().then(() => {
            if (!mounted) return;
        });
        return () => { mounted = false; };
    }, [fetchEvents]);

    const connect = () => {
        window.location.href = '/api/google-calendar/auth';
    };

    const createEvent = async (event: {
        title: string;
        start: string;
        end: string;
        description?: string;
        location?: string;
    }) => {
        const res = await fetch('/api/google-calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        const data = await res.json();
        if (data.success) {
            await fetchEvents(); // Refresh
        }
        return data;
    };

    return { events, connected, loading, connect, createEvent, refresh: fetchEvents };
}
