"use client";

import { Draggable } from "@hello-pangea/dnd";
import { formatCurrency, getWhatsAppUrl } from "@/lib/utils";
import { TEMPERATURA_COLORS } from "@/lib/constants";
import { Lead } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, MoreHorizontal } from "lucide-react";

interface LeadCardProps {
    lead: Lead;
    index: number;
    onOpenDetail: (lead: Lead) => void;
}

export function LeadCard({ lead, index, onOpenDetail }: LeadCardProps) {
    return (
        <Draggable draggableId={lead.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-3 group ${snapshot.isDragging ? "opacity-90 rotate-2 scale-105" : ""}`}
                    style={provided.draggableProps.style}
                >
                    <Card
                        className="glass-card border-l-4 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing"
                        style={{ borderLeftColor: lead.temperatura.includes('Caliente') ? '#ef4444' : lead.temperatura.includes('Tibio') ? '#f97316' : '#3b82f6' }}
                        onClick={() => onOpenDetail(lead)}
                    >
                        <CardHeader className="p-3 pb-0 flex flex-row justify-between items-start space-y-0">
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold text-sm leading-none line-clamp-1">{lead.prospecto}</span>
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                    {lead.servicio_interes || "Sin servicio"}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-3 pt-2 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <Badge variant="outline" className={`${TEMPERATURA_COLORS[lead.temperatura]} text-[10px] px-1.5 py-0 h-5`}>
                                    {lead.temperatura}
                                </Badge>
                                <span className="text-xs font-mono font-medium text-muted-foreground">
                                    {formatCurrency(lead.ticket_estimado)}
                                </span>
                            </div>

                            {lead.whatsapp && (
                                <Button
                                    size="sm"
                                    variant="whatsapp"
                                    className="w-full h-7 text-xs gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(getWhatsAppUrl(lead.whatsapp!), "_blank");
                                    }}
                                >
                                    <MessageCircle className="h-3 w-3" />
                                    WhatsApp
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </Draggable>
    );
}
