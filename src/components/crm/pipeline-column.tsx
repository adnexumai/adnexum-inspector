"use client";

import { Droppable } from "@hello-pangea/dnd";
import { LeadEstado, Lead } from "@/types";
import { LeadCard } from "./lead-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PipelineColumnProps {
    id: LeadEstado;
    leads: Lead[];
    color: string;
    onOpenDetail: (lead: Lead) => void;
}

export function PipelineColumn({ id, leads, color, onOpenDetail }: PipelineColumnProps) {
    const totalValue = leads.reduce((acc, lead) => acc + (lead.ticket_estimado || 0), 0);

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-secondary/20 rounded-xl border border-border/50 backdrop-blur-sm">
            {/* Header */}
            <div className={cn("p-3 flex flex-col gap-2 border-b border-border/50 transition-colors", color)}>
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm flex items-center gap-2">
                        {id}
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full bg-background/50">
                            {leads.length}
                        </Badge>
                    </h3>
                </div>
                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 w-full" style={{ width: '100%' }}></div>
                    {/* Dynamic progress bar could go here but simple line is cleaner */}
                </div>
                <p className="text-xs font-mono text-muted-foreground text-right">
                    Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalValue)}
                </p>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <ScrollArea className="flex-1 p-2">
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn(
                                "min-h-[100px] transition-colors rounded-lg",
                                snapshot.isDraggingOver ? "bg-primary/5" : ""
                            )}
                        >
                            {leads.map((lead, index) => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    index={index}
                                    onOpenDetail={onOpenDetail}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    </ScrollArea>
                )}
            </Droppable>
        </div>
    );
}
