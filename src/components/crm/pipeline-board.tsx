"use client";

import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Lead, LeadEstado } from "@/types";
import { CRMStage } from "@/actions/crm-config";
import { PipelineColumn } from "./pipeline-column";
import { updateLeadStatus } from "@/actions/leads";
import { LeadDetailSheet } from "./lead-detail-sheet";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "./lead-form";
import { StageManager } from "./stage-manager";
import { useRouter, useSearchParams } from "next/navigation";

interface PipelineBoardProps {
    initialLeads: Lead[];
    initialStages: CRMStage[];
}

export function PipelineBoard({ initialLeads, initialStages }: PipelineBoardProps) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [stages, setStages] = useState<CRMStage[]>(initialStages);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setLeads(initialLeads);
    }, [initialLeads]);

    useEffect(() => {
        setStages(initialStages);
    }, [initialStages]);

    useEffect(() => {
        if (searchParams.get("new") === "true") {
            setIsCreateOpen(true);
            // Remove query param without refresh
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("new");
            router.replace(`/pipeline?${newParams.toString()}`);
        }
    }, [searchParams, router]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId as LeadEstado;

        // Optimistic update
        const updatedLeads = leads.map(lead =>
            lead.id === draggableId ? { ...lead, estado: newStatus } : lead
        );
        setLeads(updatedLeads);

        // Server update
        const res = await updateLeadStatus(draggableId, newStatus);
        if (res.error) {
            toast.error("Error al mover lead");
            setLeads(initialLeads); // Revert
        }
    };

    const leadsByStatus = stages.reduce((acc, stage) => {
        acc[stage.name] = leads.filter((lead) => lead.estado === stage.name);
        return acc;
    }, {} as Record<string, Lead[]>);

    if (!isMounted) return null;

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Pipeline Comercial</h1>
                    <p className="text-muted-foreground text-sm">Gestiona tus prospectos y ventas.</p>
                </div>
                <div className="flex gap-2">
                    <StageManager
                        initialStages={stages}
                        onUpdate={() => {
                            router.refresh();
                            // In a real app we might re-fetch manually or rely on router refresh
                        }}
                    />
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Lead
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Lead</DialogTitle>
                            </DialogHeader>
                            <LeadForm stages={stages} onSuccess={() => setIsCreateOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex h-[calc(100vh-180px)] overflow-x-auto gap-4 pb-4">
                    {stages.map((stage) => (
                        <PipelineColumn
                            key={stage.id}
                            id={stage.name}
                            leads={leadsByStatus[stage.name] || []}
                            color={stage.color}
                            onOpenDetail={(lead) => {
                                setSelectedLead(lead);
                                setIsDetailOpen(true);
                            }}
                        />
                    ))}
                    {stages.length === 0 && (
                        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                            No hay etapas configuradas.
                        </div>
                    )}
                </div>
            </DragDropContext>

            <LeadDetailSheet
                lead={selectedLead}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </>
    );
}
