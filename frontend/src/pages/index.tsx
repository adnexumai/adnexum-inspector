import { useState, useEffect } from 'react';

interface InvestigationResult {
    url: string;
    diagnosis: {
        business_name: string;
        overall_score: number;
        executive_summary: string[];
        problems: Array<{
            title: string;
            description: string;
            evidence: string;
            source: string;
            severity: number;
            solution: string | null;
        }>;
        opportunities: Array<{
            title: string;
            description: string;
            solution: string | null;
        }>;
        strengths: Array<{
            title: string;
            description: string;
        }>;
        recommended_solutions: string[];
    };
    maps_data: {
        rating: number | null;
        total_reviews: number;
        pain_signals: string[];
    } | null;
    loom_script: string;
    call_questions: string[];
}

type TabType = 'summary' | 'problems' | 'opportunities' | 'loom' | 'questions';

export default function Home() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [status, setStatus] = useState<string>('');
    const [result, setResult] = useState<InvestigationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('summary');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const startInvestigation = async () => {
        if (!url) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        setProgress(0);
        setCurrentStep('Iniciando investigación...');
        setStatus('pending');

        try {
            const response = await fetch(`${API_URL}/api/investigate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, include_maps: true, include_social: true }),
            });

            if (!response.ok) throw new Error('Error al iniciar investigación');

            const data = await response.json();
            setJobId(data.job_id);
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    // Polling para obtener progreso
    useEffect(() => {
        if (!jobId || !isLoading) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/investigate/${jobId}`);
                const data = await response.json();

                setProgress(data.progress);
                setCurrentStep(data.current_step);
                setStatus(data.status);

                if (data.status === 'completed') {
                    setResult(data.result);
                    setIsLoading(false);
                    clearInterval(interval);
                } else if (data.status === 'failed') {
                    setError(data.error || 'Error desconocido');
                    setIsLoading(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Error polling:', err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, isLoading, API_URL]);

    const getScoreClass = (score: number) => {
        if (score >= 70) return 'good';
        if (score >= 40) return 'medium';
        return 'bad';
    };

    const getSeverityClass = (severity: number) => {
        if (severity >= 7) return 'high';
        if (severity >= 4) return 'medium';
        return 'low';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('¡Copiado al portapapeles!');
    };

    return (
        <div>
            {/* Header */}
            <header className="header">
                <div className="container header-content">
                    <div className="logo">
                        Adnexum <span>Inspector</span>
                    </div>
                    <nav>
                        <a href="https://adnexum.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gray)', textDecoration: 'none' }}>
                            ← Volver a Adnexum
                        </a>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="hero">
                <h1>🔍 Prospección B2B 360°</h1>
                <p>
                    Ingresa la URL de un negocio y obtén un informe vendible completo con problemas,
                    oportunidades, guion Loom y preguntas para la llamada de discovery.
                </p>

                <div className="search-box">
                    <input
                        type="url"
                        placeholder="https://negocio-a-investigar.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && startInvestigation()}
                        disabled={isLoading}
                    />
                    <button onClick={startInvestigation} disabled={isLoading || !url}>
                        {isLoading ? '🔄 Investigando...' : '🚀 Investigar'}
                    </button>
                </div>
            </section>

            {/* Progress */}
            {isLoading && (
                <section className="progress-section animate-in">
                    <div className="progress-card">
                        <div className="progress-header">
                            <span className="progress-title">Investigación en curso</span>
                            <span className={`progress-status ${status}`}>{status}</span>
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="progress-step loading">{currentStep}</p>
                    </div>
                </section>
            )}

            {/* Error */}
            {error && (
                <section className="progress-section animate-in">
                    <div className="progress-card" style={{ borderColor: 'var(--danger)' }}>
                        <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>❌ Error</h3>
                        <p>{error}</p>
                    </div>
                </section>
            )}

            {/* Results */}
            {result && (
                <section className="results-section animate-in">
                    <div className="results-header">
                        <h2 className="results-title">
                            📊 {result.diagnosis.business_name}
                        </h2>
                        <div className="score-badge">
                            <span>Score:</span>
                            <span className={`score ${getScoreClass(result.diagnosis.overall_score)}`}>
                                {result.diagnosis.overall_score}/100
                            </span>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <div className="summary-card">
                            <h3>Problemas</h3>
                            <div className="value problems">{result.diagnosis.problems.length}</div>
                        </div>
                        <div className="summary-card">
                            <h3>Oportunidades</h3>
                            <div className="value opportunities">{result.diagnosis.opportunities.length}</div>
                        </div>
                        <div className="summary-card">
                            <h3>Fortalezas</h3>
                            <div className="value strengths">{result.diagnosis.strengths.length}</div>
                        </div>
                        {result.maps_data?.rating && (
                            <div className="summary-card">
                                <h3>Google Maps</h3>
                                <div className="value" style={{ color: 'var(--warning)' }}>
                                    {result.maps_data.rating}⭐
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Executive Summary */}
                    <div className="script-box" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>🎯 Resumen Ejecutivo</h3>
                        <ul style={{ paddingLeft: '20px' }}>
                            {result.diagnosis.executive_summary.map((item, i) => (
                                <li key={i} style={{ marginBottom: '8px', lineHeight: '1.6' }}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'problems' ? 'active' : ''}`}
                            onClick={() => setActiveTab('problems')}
                        >
                            🔴 Problemas ({result.diagnosis.problems.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'opportunities' ? 'active' : ''}`}
                            onClick={() => setActiveTab('opportunities')}
                        >
                            💰 Oportunidades ({result.diagnosis.opportunities.length})
                        </button>
                        <button
                            className={`tab ${activeTab === 'loom' ? 'active' : ''}`}
                            onClick={() => setActiveTab('loom')}
                        >
                            🎬 Guion Loom
                        </button>
                        <button
                            className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('questions')}
                        >
                            📞 Preguntas
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'problems' && (
                        <div className="insights-list animate-in">
                            {result.diagnosis.problems.length === 0 ? (
                                <div className="script-box">
                                    <p style={{ color: 'var(--gray)' }}>No se detectaron problemas críticos.</p>
                                </div>
                            ) : (
                                result.diagnosis.problems.map((problem, i) => (
                                    <div key={i} className="insight-card problem">
                                        <div className="insight-header">
                                            <h3 className="insight-title">{problem.title}</h3>
                                            <span className={`insight-severity ${getSeverityClass(problem.severity)}`}>
                                                Severidad: {problem.severity}/10
                                            </span>
                                        </div>
                                        <p className="insight-description">{problem.description}</p>
                                        <div className="insight-evidence">
                                            <strong>Evidencia:</strong> {problem.evidence}
                                            <br />
                                            <strong>Fuente:</strong> {problem.source}
                                        </div>
                                        {problem.solution && (
                                            <div className="insight-solution">
                                                <h4>💡 Solución Adnexum</h4>
                                                <p>{problem.solution}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'opportunities' && (
                        <div className="insights-list animate-in">
                            {result.diagnosis.opportunities.length === 0 ? (
                                <div className="script-box">
                                    <p style={{ color: 'var(--gray)' }}>No se identificaron oportunidades adicionales.</p>
                                </div>
                            ) : (
                                result.diagnosis.opportunities.map((opp, i) => (
                                    <div key={i} className="insight-card opportunity">
                                        <h3 className="insight-title">{opp.title}</h3>
                                        <p className="insight-description">{opp.description}</p>
                                        {opp.solution && (
                                            <div className="insight-solution">
                                                <h4>💡 Cómo Adnexum lo resuelve</h4>
                                                <p>{opp.solution}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'loom' && (
                        <div className="script-box animate-in">
                            <pre>{result.loom_script}</pre>
                            <button
                                className="copy-button"
                                onClick={() => copyToClipboard(result.loom_script)}
                            >
                                📋 Copiar Guion
                            </button>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="questions-list animate-in">
                            <ol>
                                {result.call_questions.map((q, i) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ol>
                            <button
                                className="copy-button"
                                onClick={() => copyToClipboard(result.call_questions.join('\n'))}
                            >
                                📋 Copiar Preguntas
                            </button>
                        </div>
                    )}

                    {/* Recommended Solutions */}
                    {result.diagnosis.recommended_solutions.length > 0 && (
                        <div className="script-box" style={{ marginTop: '32px' }}>
                            <h3 style={{ marginBottom: '16px' }}>🚀 Plan de Implementación Sugerido</h3>
                            <ol style={{ paddingLeft: '20px' }}>
                                {result.diagnosis.recommended_solutions.map((sol, i) => (
                                    <li key={i} style={{ marginBottom: '12px' }}>
                                        <input type="checkbox" style={{ marginRight: '12px' }} />
                                        {sol}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </section>
            )}

            {/* Footer */}
            <footer className="footer">
                <p>Adnexum Inspector v1.0 | Sistema de Prospección B2B 360°</p>
                <p style={{ marginTop: '8px' }}>
                    <a href="https://adnexum.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                        adnexum.com
                    </a>
                </p>
            </footer>
        </div>
    );
}
