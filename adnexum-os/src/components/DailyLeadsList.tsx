'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Users, Search, ChevronDown } from 'lucide-react';
import type { TrackedLead } from '@/lib/types';

interface LeadSuggestion {
    id: string;
    business_name: string;
    owner_name: string;
    estado_actual: string;
}

interface DailyLeadsListProps {
    title: string;
    badgeLabel: string;
    badgeColor: string;
    headerGradient: string;
    items: TrackedLead[];
    onAdd: (item: TrackedLead) => void;
    onRemove: (name: string) => void;
    placeholder?: string;
    emptyText?: string;
    crmLeads?: LeadSuggestion[]; // Optional leads from CRM for autocomplete
}

function getInitials(name: string) {
    return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getAvatarColor(name: string) {
    const colors = [
        'from-blue-500 to-blue-600',
        'from-violet-500 to-purple-600',
        'from-pink-500 to-rose-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-cyan-500 to-sky-600',
        'from-rose-500 to-red-600',
        'from-indigo-500 to-violet-600',
    ];
    const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length;
    return colors[idx];
}

function formatTime(iso: string) {
    try {
        return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
}

/** Safely normalizes data that could be a string (legacy) or TrackedLead object */
export function normalizeItems(rawItems: (TrackedLead | string)[]): TrackedLead[] {
    return (rawItems || []).map(item => {
        if (typeof item === 'string') {
            return { name: item, time: new Date().toISOString() };
        }
        return item;
    });
}

export function DailyLeadsList({
    title, badgeLabel, badgeColor, headerGradient,
    items, onAdd, onRemove, placeholder, emptyText, crmLeads = []
}: DailyLeadsListProps) {
    const [inputValue, setInputValue] = useState('');
    const [noteValue, setNoteValue] = useState('');
    const [showNote, setShowNote] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const normalizedItems = normalizeItems(items as (TrackedLead | string)[]);

    const filteredCrm = crmLeads.filter(l => {
        const q = inputValue.toLowerCase();
        return q.length > 0 && (
            l.business_name.toLowerCase().includes(q) ||
            l.owner_name.toLowerCase().includes(q)
        );
    }).slice(0, 5);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addItem(inputValue);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData('text');
        if (text.includes('\n') || text.includes(',')) {
            e.preventDefault();
            const names = text.split(/[\n,]/).map(n => n.trim()).filter(Boolean);
            names.forEach(name => {
                if (!normalizedItems.some(i => i.name.toLowerCase() === name.toLowerCase())) {
                    onAdd({ name, time: new Date().toISOString() });
                }
            });
            setInputValue('');
            setShowDropdown(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    const addItem = (name: string, fromCrm?: LeadSuggestion) => {
        const trimmed = name.trim();
        if (!trimmed) {
            if (inputRef.current) inputRef.current.focus();
            return;
        }
        if (normalizedItems.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
            setInputValue('');
            setShowDropdown(false);
            if (inputRef.current) inputRef.current.focus();
            return;
        }
        onAdd({
            name: fromCrm ? fromCrm.business_name : trimmed,
            note: fromCrm ? `CRM: ${fromCrm.estado_actual}` : (noteValue.trim() || undefined),
            time: new Date().toISOString()
        });
        setInputValue('');
        setNoteValue('');
        setShowNote(false);
        setShowDropdown(false);
        // Automatically refocus so the user can keep typing rapidly
        if (inputRef.current) inputRef.current.focus();
    };

    // Sort newest first
    const sortedItems = [...normalizedItems].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return (
        <section className="bg-[#13131f] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col shadow-xl">
            {/* Header gradient strip */}
            <div className={`bg-gradient-to-r ${headerGradient} px-5 py-3.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm tracking-wide">{title}</span>
                    {normalizedItems.length > 0 && (
                        <span className="text-white/70 text-xs">·</span>
                    )}
                </div>
                <div className="bg-black/20 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                    {normalizedItems.length}
                </div>
            </div>

            {/* Input */}
            <div className="p-3 border-b border-white/[0.05] relative">
                <form onSubmit={handleAdd} className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setShowDropdown(true);
                            }}
                            onPaste={handlePaste}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                            placeholder={placeholder || 'Nombre del lead...'}
                            className="w-full bg-black/30 border border-white/[0.08] rounded-xl pl-9 pr-20 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
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
                                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-40"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* CRM Autocomplete dropdown */}
                    {showDropdown && filteredCrm.length > 0 && (
                        <div className="absolute left-3 right-3 mt-1 bg-[#1c1c2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {filteredCrm.map(lead => (
                                <button
                                    key={lead.id}
                                    type="button"
                                    onMouseDown={() => addItem(lead.business_name, lead)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
                                >
                                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(lead.business_name)} flex items-center justify-center text-white text-[10px] font-black shrink-0`}>
                                        {getInitials(lead.business_name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white font-medium truncate">{lead.business_name}</p>
                                        <p className="text-[10px] text-slate-500">{lead.owner_name} · {lead.estado_actual}</p>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-600 ml-auto shrink-0 rotate-[-90deg]" />
                                </button>
                            ))}
                        </div>
                    )}

                    {showNote && (
                        <input
                            type="text"
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            placeholder="Nota rápida (ej: respondió interesado...)"
                            className="w-full bg-black/20 border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
                        />
                    )}
                </form>
            </div>

            {/* List */}
            <ul className="flex-1 overflow-y-auto divide-y divide-white/[0.03] max-h-80">
                {sortedItems.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-slate-600 gap-2 px-4 text-center">
                        <Users className="w-7 h-7 opacity-20" />
                        <span className="text-xs font-medium leading-snug">{emptyText || 'Ningún lead trackeado aún'}</span>
                    </div>
                ) : (
                    sortedItems.map((item, idx) => {
                        const initials = getInitials(item.name);
                        const avatarGradient = getAvatarColor(item.name);
                        return (
                            <li key={item.name + idx} className="group px-4 py-3 flex items-start gap-3 hover:bg-white/[0.025] transition-colors">
                                {/* Avatar */}
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shrink-0 text-white text-[11px] font-black shadow-md`}>
                                    {initials}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-white leading-tight">{item.name}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                                            {badgeLabel}
                                        </span>
                                    </div>
                                    {item.note && (
                                        <p className="text-xs text-slate-400 mt-0.5 truncate">{item.note}</p>
                                    )}
                                    <span className="text-[10px] text-slate-600 font-medium tabular-nums">{formatTime(item.time)}</span>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={() => onRemove(item.name)}
                                    className="p-1 text-slate-700 hover:text-red-400 rounded transition-all opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
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
