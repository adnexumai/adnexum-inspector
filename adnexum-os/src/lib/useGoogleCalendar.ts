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
            if (timeMin) params.set('timeMin', timeMin);
            if (timeMax) params.set('timeMax', timeMax);

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
        fetchEvents();
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
