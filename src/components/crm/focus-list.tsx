"use client";

import { Lead } from "@/types";
import { formatRelativeDate, getWhatsAppUrl, getDaysSinceContact } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Clock, ArrowRight } from "lucide-react";
import { logContact } from "@/actions/leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FocusListProps {
    leads: Lead[];
}

export function FocusList({ leads }: FocusListProps) {
    const router = useRouter();

    async function handleContact(lead: Lead) {
        if (!lead.whatsapp) {
            toast.error("Lead sin número de WhatsApp");
            return;
        }

        // Open WhatsApp
        window.open(getWhatsAppUrl(lead.whatsapp), "_blank");

        // Log contact
        const res = await logContact(lead.id);
        if (res.error) {
            toast.error("Error al registrar contacto");
        } else {
            toast.success("Contacto registrado");
            router.refresh(); // Refresh to update list/timestamps
        }
    }

    if (leads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">¡Todo al día!</h3>
                <p className="text-muted-foreground mt-2">
                    No tienes leads pendientes de seguimiento por hoy.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {leads.map((lead) => {
                const daysSince = getDaysSinceContact(lead.ultimo_contacto);
                const isHot = lead.temperatura === "🔥 Caliente";

                return (
                    <Card key={lead.id} className="hover:border-primary/30 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold truncate">{lead.prospecto}</h3>
                                    <Badge variant={isHot ? "hot" : "default"} className="text-[10px] h-5 px-1.5">
                                        {lead.temperatura}
                                    </Badge>
                                    {daysSince !== null && daysSince > 3 && (
                                        <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                                            {daysSince} días sin contacto
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <p className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Último: {lead.ultimo_contacto ? formatRelativeDate(lead.ultimo_contacto) : "Nunca"}
                                    </p>
                                    {lead.proximo_paso && (
                                        <p className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-md">
                                            <ArrowRight className="h-3 w-3" />
                                            {lead.proximo_paso}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0">
                                <Button
                                    onClick={() => handleContact(lead)}
                                    variant="whatsapp"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="hidden sm:inline">Contactar</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
        </svg>
    );
}
