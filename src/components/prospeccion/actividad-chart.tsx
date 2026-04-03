"use client";

import { KPIs } from "@/actions/prospeccion";

export function ActividadChart({ porDia }: { porDia: KPIs["porDia"] }) {
    if (!porDia.length) {
        return (
            <div className="flex items-center justify-center h-28 text-muted-foreground text-sm">
                Sin datos aún
            </div>
        );
    }

    const ultimos = [...porDia].reverse().slice(-14);
    const maxVal = Math.max(...ultimos.map((d) => d.contactos), 1);

    return (
        <div className="flex items-end gap-1.5 h-28">
            {ultimos.map((d) => {
                const hC = Math.max((d.contactos / maxVal) * 96, 4);
                const hR = Math.max((d.respuestas / maxVal) * 96, d.respuestas > 0 ? 4 : 0);
                const label = d.dia.slice(5); // MM-DD

                return (
                    <div key={d.dia} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <div className="flex items-end gap-0.5 h-24 w-full justify-center">
                            <div
                                title={`${d.contactos} contactos`}
                                className="bg-blue-500/70 rounded-sm flex-1 min-w-[4px] transition-all"
                                style={{ height: `${hC}px` }}
                            />
                            <div
                                title={`${d.respuestas} respuestas`}
                                className="bg-green-400/80 rounded-sm flex-1 min-w-[4px] transition-all"
                                style={{ height: `${hR}px` }}
                            />
                        </div>
                        <span className="text-[9px] text-muted-foreground/60 truncate w-full text-center">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}
