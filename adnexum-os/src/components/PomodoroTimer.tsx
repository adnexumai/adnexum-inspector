'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PomodoroTimerProps {
    pomodorosCompleted: number;
    onComplete: () => void;
}

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export function PomodoroTimer({ pomodorosCompleted, onComplete }: PomodoroTimerProps) {
    const [timeLeft, setTimeLeft] = useState(WORK_TIME);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (isRunning && timeLeft === 0) {
            // Timer finished
            setIsRunning(false);
            if (!isBreak) {
                // Work mode finished -> start break mode
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#ec4899', '#f43f5e', '#fbbf24'] });
                onComplete();
                setIsBreak(true);
                setTimeLeft(BREAK_TIME);
            } else {
                // Break mode finished -> back to work
                setIsBreak(false);
                setTimeLeft(WORK_TIME);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, isBreak, onComplete]);

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(WORK_TIME);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const pct = isBreak ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100 : ((WORK_TIME - timeLeft) / WORK_TIME) * 100;

    return (
        <section className="bg-gradient-to-br from-[#1e1e2d] to-[#131320] rounded-2xl p-6 border border-white/[0.06] shadow-xl relative overflow-hidden">
            {/* Background design */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] ${isBreak ? 'bg-teal-500/20' : 'bg-rose-500/20'}`} />

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isBreak ? 'bg-teal-500/10' : 'bg-rose-500/10'}`}>
                        {isBreak ? <Coffee className="w-5 h-5 text-teal-400" /> : <Briefcase className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-wide">
                            {isBreak ? 'Descanso' : 'Deep Work'}
                        </h2>
                        <p className="text-xs text-slate-400">Técnica Pomodoro</p>
                    </div>
                </div>

                <div className="flex gap-1.5 items-center bg-white/[0.05] py-1 px-3 rounded-full border border-white/[0.05]">
                    <span className="text-xl">🍅</span>
                    <span className="font-bold text-white ml-1">{pomodorosCompleted}</span>
                    <span className="text-xs text-slate-400 font-medium">completados</span>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center my-6 relative z-10">
                <div className="relative flex items-center justify-center mb-6">
                    {/* Glow */}
                    {isRunning && <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 ${isBreak ? 'bg-teal-500' : 'bg-rose-500'}`} />}

                    <span className={`text-6xl font-black tabular-nums tracking-tighter ${isBreak ? 'text-teal-400' : 'text-rose-400'} drop-shadow-md`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden mb-8">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${isBreak ? 'bg-teal-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTimer}
                        className={`w-14 h-14 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-lg ${isBreak
                                ? 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/25'
                                : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/25'
                            }`}
                    >
                        {isRunning ? <Pause className="w-6 h-6 text-white shrink-0" fill="currentColor" /> : <Play className="w-6 h-6 ml-1 text-white shrink-0" fill="currentColor" />}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

        </section>
    );
}
