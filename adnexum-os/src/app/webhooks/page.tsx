'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash, Check, X, Webhook } from 'lucide-react';

interface WebhookConfig {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    created_at: string;
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUrl, setNewUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>(['lead.created']);

    const availableEvents = [
        { id: 'lead.created', label: 'Lead Created' },
        { id: 'lead.updated', label: 'Lead Status Changed' },
        { id: 'lead.won', label: 'Lead Won' },
        { id: 'task.created', label: 'Task Created' },
    ];

    useEffect(() => {
        loadWebhooks();
    }, []);

    const loadWebhooks = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('webhook_config').select('*').order('created_at', { ascending: false });
        if (!error && data) setWebhooks(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl) return;

        const { data, error } = await supabase.from('webhook_config').insert([{
            url: newUrl,
            events: selectedEvents,
            active: true
        }]).select().single();

        if (error) {
            alert('Error creating webhook: ' + error.message);
        } else if (data) {
            setWebhooks([data, ...webhooks]);
            setNewUrl('');
            setSelectedEvents(['lead.created']);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        await supabase.from('webhook_config').delete().eq('id', id);
        setWebhooks(webhooks.filter(w => w.id !== id));
    };

    const toggleEvent = (eventId: string) => {
        setSelectedEvents(prev =>
            prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Webhooks & Automation
                    </h1>
                    <p className="text-white/60">Connect Adnexum OS with external tools like n8n, Zapier, or Make.</p>
                </div>
            </div>

            {/* Create Webhook */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Webhook className="text-violet-400" />
                    Add New Webhook
                </h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Endpoint URL</label>
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://webhook.site/..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Trigger Events</label>
                        <div className="flex flex-wrap gap-2">
                            {availableEvents.map(event => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => toggleEvent(event.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${selectedEvents.includes(event.id)
                                            ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                        }`}
                                >
                                    {event.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !newUrl}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-xl transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Create Webhook
                    </button>
                </form>
            </div>

            {/* List Webhooks */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Active Webhooks</h2>
                {loading ? (
                    <div className="text-white/40">Loading...</div>
                ) : webhooks.length === 0 ? (
                    <div className="text-white/40 italic">No webhooks configured.</div>
                ) : (
                    <div className="grid gap-4">
                        {webhooks.map(webhook => (
                            <div key={webhook.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-violet-500/30 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${webhook.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="font-mono text-sm text-white/80 truncate max-w-md">{webhook.url}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {webhook.events.map(ev => (
                                            <span key={ev} className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/50">
                                                {ev}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(webhook.id)}
                                    className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
