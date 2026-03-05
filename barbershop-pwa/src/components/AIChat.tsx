'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
}

export default function AIChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '🤖 Soy tu asistente IA de Alpha Omega Estudio. Estoy conectado a la base de datos para responder consultas en tiempo real. ¿En qué te puedo ayudar hoy?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input.trim();
        const userMessage: Message = {
            role: 'user',
            content: userText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Use internal API proxy to avoid CORS issues
            const webhookUrl = '/api/webhook';

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    timestamp: new Date().toISOString(),
                    // You can add session ID or user info here if needed
                }),
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            const aiResponseText = data.output || data.message || data.text || 'No recibí una respuesta válida del agente.';

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: aiResponseText, timestamp: new Date() },
            ]);

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: '⚠️ Lo siento, hubo un error al conectar con el agente. Por favor, verificá la configuración o intentá más tarde.',
                    timestamp: new Date(),
                    isError: true,
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="glass-card-static flex flex-col overflow-hidden" style={{ height: '480px' }}>
            {/* Header */}
            <div className="p-4 flex items-center gap-3"
                style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.15), rgba(212,168,83,0.05))', border: '1px solid rgba(212,168,83,0.2)' }}>
                    <Sparkles size={18} style={{ color: 'var(--accent-gold)' }} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                        Asistente IA (n8n)
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                        Conectado a webhook
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                    <span className="text-xs" style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
                style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                                style={{
                                    background: msg.isError ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)',
                                    border: msg.isError ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
                                }}>
                                {msg.isError ? <AlertCircle size={14} className="text-red-500" /> : <Bot size={14} style={{ color: 'var(--accent-gold)' }} />}
                            </div>
                        )}
                        <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                            style={msg.isError ? { border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' } : {}}>
                            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}
                                dangerouslySetInnerHTML={{
                                    __html: msg.content
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                }}
                            />
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                                style={{ background: 'var(--accent-gold)' }}>
                                <User size={14} color="#0a0a0a" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-2 items-start">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--bg-elevated)' }}>
                            <Bot size={14} style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <div className="chat-bubble-ai">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0s' }} />
                                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0.15s' }} />
                                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0.3s' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input-premium flex-1"
                        placeholder="Preguntá algo sobre el negocio..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        style={{ padding: '12px 16px', fontSize: '14px' }}
                    />
                    <button
                        className="btn-gold"
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        style={{ padding: '12px 16px', opacity: input.trim() ? 1 : 0.5 }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
