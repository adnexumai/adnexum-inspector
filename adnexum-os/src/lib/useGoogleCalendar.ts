'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

    // Refs to track state and avoid infinite loops
    const lastFetchParams = useRef<string>('');

    const fetchEvents = useCallback(async (force = false) => {
        const paramsKey = `${timeMin}-${timeMax}`;

        // If not forced and params haven't changed since last successful fetch, skip
        if (!force && lastFetchParams.current === paramsKey && events.length > 0) {
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            const start = timeMin || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const end = timeMax || new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString();

            params.set('timeMin', start);
            params.set('timeMax', end);

            const res = await fetch(`/api/google-calendar/events?${params}`);
            const data = await res.json();

            setConnected(data.connected ?? false);

            // Only update events if they are different (basic JSON compare)
            setEvents(prev => {
                const isSame = JSON.stringify(prev) === JSON.stringify(data.events ?? []);
                return isSame ? prev : (data.events ?? []);
            });

            // Mark this fetch as done for these params
            lastFetchParams.current = paramsKey;

        } catch (err) {
            console.error('Error fetching Google Calendar:', err);
            setConnected(false);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [timeMin, timeMax, events.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Initial fetch on mount or when params change
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
            await fetchEvents(true); // Force refresh
        }
        return data;
    };

    return { events, connected, loading, connect, createEvent, refresh: () => fetchEvents(true) };
}
