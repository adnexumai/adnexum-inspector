import { KPIs } from "@/actions/prospeccion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, MessageCircle, BarChart2, Users } from "lucide-react";

export function KpiCards({ kpis }: { kpis: KPIs }) {
    const cards = [
        {
            label: "Contactados hoy",
            value: kpis.hoy.contactos,
            sub: "mensajes enviados",
            icon: MessageCircle,
            color: "text-green-400",
        },
        {
            label: "Respuestas hoy",
            value: kpis.hoy.respuestas,
            sub: "prospectos que respondieron",
            icon: TrendingUp,
            color: "text-blue-400",
        },
        {
            label: "Tasa de respuesta",
            value: `${kpis.hoy.tasa}%`,
            sub: "objetivo: > 20%",
            icon: BarChart2,
            color: kpis.hoy.tasa >= 20 ? "text-green-400" : "text-yellow-400",
        },
        {
            label: "Total histórico",
            value: kpis.totalHistorico,
            sub: "prospectos contactados",
            icon: Users,
            color: "text-muted-foreground",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
                <Card key={c.label} className="glass-card">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {c.label}
                            </p>
                            <c.icon className={`h-4 w-4 ${c.color}`} />
                        </div>
                        <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
