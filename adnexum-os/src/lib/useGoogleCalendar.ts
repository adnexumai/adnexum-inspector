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
    const [version, setVersion] = useState(0); // Used to trigger refresh

    useEffect(() => {
        let mounted = true;
        const fetchEvents = async () => {
            if (!mounted) return;
            setLoading(true);
            try {
                const params = new URLSearchParams();
                const start = timeMin || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
                const end = timeMax || new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString();

                params.set('timeMin', start);
                params.set('timeMax', end);

                const res = await fetch(`/api/google-calendar/events?${params}`);
                const data = await res.json();

                if (mounted) {
                    setConnected(data.connected ?? false);
                    setEvents(prev => {
                        // Deep compare to avoid re-renders if data matches
                        const isSame = JSON.stringify(prev) === JSON.stringify(data.events ?? []);
                        return isSame ? prev : (data.events ?? []);
                    });
                }
            } catch (err) {
                console.error('Error fetching Google Calendar:', err);
                if (mounted) {
                    setConnected(false);
                    setEvents([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchEvents();

        return () => { mounted = false; };
    }, [timeMin, timeMax, version]);

    const connect = () => {
        window.location.href = '/api/google-calendar/auth';
    };

    const refresh = useCallback(() => {
        setVersion(v => v + 1);
    }, []);

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
            refresh();
        }
        return data;
    };

    return { events, connected, loading, connect, createEvent, refresh };
}
