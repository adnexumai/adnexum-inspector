import { getProspectos, getKPIs } from "@/actions/prospeccion";
import { KpiCards } from "@/components/prospeccion/kpi-cards";
import { ProspectosTable } from "@/components/prospeccion/prospectos-table";
import { ActividadChart } from "@/components/prospeccion/actividad-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 30; // refrescar cada 30s

export default async function ProspeccionPage() {
    const [prospectos, kpis] = await Promise.all([getProspectos(200), getKPIs()]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">Prospección en Frío</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Tracker automático vía YCloud · WhatsApp Business
                </p>
            </div>

            <KpiCards kpis={kpis} />

            <Card className="glass-card">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-4">
                        Actividad últimos 14 días
                        <span className="flex items-center gap-1.5 text-xs">
                            <span className="inline-block w-2 h-2 rounded-sm bg-blue-500/70" /> Contactos
                            <span className="inline-block w-2 h-2 rounded-sm bg-green-400/80 ml-2" /> Respuestas
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ActividadChart porDia={kpis.porDia} />
                </CardContent>
            </Card>

            <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    Prospectos ({prospectos.length})
                </h2>
                <ProspectosTable prospectos={prospectos} />
            </div>
        </div>
    );
}
