import { Lead } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDaysSinceContact } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function StaleLeadsList({ leads }: { leads: Lead[] }) {
    if (leads.length === 0) {
        return (
            <Card className="glass-card h-full">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Leads Inactivos</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <p className="text-xs">El seguimiento está impecable.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">Seguimiento Atrasado</CardTitle>
                    <Badge variant="destructive" className="text-xs">{leads.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {leads.slice(0, 5).map((lead) => {
                    const days = getDaysSinceContact(lead.ultimo_contacto);
                    return (
                        <div key={lead.id} className="flex items-center justify-between pb-2 border-b border-border/50 last:border-0 last:pb-0">
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{lead.prospecto}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {lead.temperatura} • Hace {days} días
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground -rotate-45" />
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
