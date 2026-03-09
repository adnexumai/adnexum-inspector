'use client';

import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';

// Store items with timestamp so we can sort & display time
export interface TrackedLead {
    name: string;
    note?: string;
    time: string; // ISO string
}

interface DailyLeadsListProps {
    title: string;
    badgeLabel: string;         // e.g. "Prospecto" or "Seguimiento"
    badgeColor: string;         // tailwind bg class for the badge e.g. "bg-blue-500/20 text-blue-300"
    headerGradient: string;     // e.g. "from-blue-600 to-cyan-500"
    items: TrackedLead[];
    onAdd: (item: TrackedLead) => void;
    onRemove: (name: string) => void;
    placeholder?: string;
    emptyText?: string;
}

function getInitials(name: string) {
    return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getAvatarColor(name: string) {
    const colors = [
        'bg-blue-500', 'bg-violet-500', 'bg-pink-500',
        'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500',
        'bg-rose-500', 'bg-indigo-500',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
}

function formatTime(iso: string) {
    try {
        return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
}

export function DailyLeadsList({
    title, badgeLabel, badgeColor, headerGradient,
    items, onAdd, onRemove, placeholder, emptyText
}: DailyLeadsListProps) {
    const [inputValue, setInputValue] = useState('');
    const [noteValue, setNoteValue] = useState('');
    const [showNote, setShowNote] = useState(false);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        if (items.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
            setInputValue('');
            return;
        }
        onAdd({ name: trimmed, note: noteValue.trim() || undefined, time: new Date().toISOString() });
        setInputValue('');
        setNoteValue('');
        setShowNote(false);
    };

    // Sort newest first
    const sortedItems = [...items].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return (
        <section className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col">
            {/* Header gradient strip */}
            <div className={`bg-gradient-to-r ${headerGradient} px-5 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm tracking-wide">{title}</span>
                </div>
                <div className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {items.length}
                </div>
            </div>

            {/* Input */}
            <div className="p-4 border-b border-white/[0.06]">
                <form onSubmit={handleAdd} className="space-y-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={placeholder || 'Nombre del lead...'}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 pr-20 transition-all"
                        />
                        <div className="absolute right-2 top-1.5 flex gap-1">
                            <button
                                type="button"
                                onClick={() => setShowNote(s => !s)}
                                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${showNote ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-white'}`}
                                title="Agregar nota"
                            >
                                📝
                            </button>
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg transition-colors disabled:opacity-40 text-xs font-bold"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {showNote && (
                        <input
                            type="text"
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            placeholder="Nota rápida (ej: respondió interesado...)"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        />
                    )}
                </form>
            </div>

            {/* List */}
            <ul className="flex-1 overflow-y-auto divide-y divide-white/[0.04] max-h-72">
                {sortedItems.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Users className="w-8 h-8 opacity-20" />
                        <span className="text-xs font-medium">{emptyText || 'Ningún lead trackeado aún'}</span>
                    </div>
                ) : (
                    sortedItems.map(item => {
                        const initials = getInitials(item.name);
                        const avatarColor = getAvatarColor(item.name);
                        return (
                            <li key={item.name + item.time} className="group px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors">
                                {/* Avatar */}
                                <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center shrink-0 text-white text-xs font-black shadow-md`}>
                                    {initials}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-white">{item.name}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                            {badgeLabel}
                                        </span>
                                    </div>
                                    {item.note && (
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">{item.note}</p>
                                    )}
                                    <span className="text-[10px] text-slate-600 font-medium">{formatTime(item.time)}</span>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={() => onRemove(item.name)}
                                    className="p-1 text-slate-600 hover:text-red-400 rounded transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        );
                    })
                )}
            </ul>
        </section>
    );
}
