'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Flame,
    ClipboardCheck,
    CheckSquare,
    Calendar,
    FileText,
    Trophy,
    ChevronLeft,
    ChevronRight,
    Zap,
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, emoji: '📊' },
    { href: '/pipeline', label: 'Pipeline', icon: Flame, emoji: '🔥' },
    { href: '/seguimiento', label: 'Seguimiento', icon: ClipboardCheck, emoji: '📋' },
    { href: '/tareas', label: 'Tareas', icon: CheckSquare, emoji: '✅' },
    { href: '/calendario', label: 'Calendario', icon: Calendar, emoji: '📅' },
    { href: '/templates', label: 'Templates', icon: FileText, emoji: '📝' },
    { href: '/gamificacion', label: 'Gamificación', icon: Trophy, emoji: '🏆' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <aside
            style={{
                width: collapsed ? '72px' : '256px',
                minHeight: '100vh',
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 40,
                overflow: 'hidden',
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: collapsed ? '20px 12px' : '20px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--color-accent-dark), var(--color-accent))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                    }}
                >
                    <Zap size={22} color="white" />
                </div>
                {!collapsed && (
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em' }}>
                            ADNEXUM
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>
                            SALES OS
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: collapsed ? '12px' : '12px 16px',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                                fontWeight: isActive ? 600 : 400,
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                position: 'relative',
                            }}
                            title={collapsed ? item.label : undefined}
                        >
                            {isActive && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '3px',
                                        height: '20px',
                                        borderRadius: '0 3px 3px 0',
                                        background: 'var(--color-accent)',
                                    }}
                                />
                            )}
                            <Icon
                                size={20}
                                style={{
                                    flexShrink: 0,
                                    color: isActive ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                                }}
                            />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse button */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid var(--color-border)' }}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s',
                    }}
                >
                    {collapsed ? <ChevronRight size={18} /> : <>
                        <ChevronLeft size={18} />
                        <span>Colapsar</span>
                    </>}
                </button>
            </div>
        </aside>
    );
}
