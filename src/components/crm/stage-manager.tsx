"use client";

import { useState } from "react";
import { CRMStage, createStage, updateStage, deleteStage, reorderStages } from "@/actions/crm-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, X, GripVertical, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StageManagerProps {
    initialStages: CRMStage[];
    onUpdate: () => void; // Callback to refresh parent
}

const PRESET_COLORS = [
    { name: "Zinc", value: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
    { name: "Blue", value: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { name: "Green", value: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { name: "Yellow", value: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    { name: "Orange", value: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    { name: "Red", value: "bg-red-500/10 text-red-400 border-red-500/20" },
    { name: "Purple", value: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    { name: "Pink", value: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
];

export function StageManager({ initialStages, onUpdate }: StageManagerProps) {
    const [stages, setStages] = useState<CRMStage[]>(initialStages);
    const [isOpen, setIsOpen] = useState(false);
    const [newStageName, setNewStageName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync state when props change
    if (initialStages !== stages && !isOpen) {
        setStages(initialStages);
    }

    // Helper to extract bg color for preview circle
    const getBgColorClass = (fullClass: string) => {
        return fullClass.split(" ").find(c => c.startsWith("bg-")) || "bg-zinc-500";
    };

    const handleCreate = async () => {
        if (!newStageName.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await createStage(newStageName, PRESET_COLORS[0].value); // Default zinc
            if (res.error) throw new Error(res.error);
            toast.success("Etapa creada");
            setNewStageName("");
            onUpdate();
            // Optimistic update not needed as onUpdate will revalidate
        } catch (error) {
            toast.error("Error al crear etapa");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar etapa "${name}"? No debe tener leads activos.`)) return;
        try {
            const res = await deleteStage(id);
            if (res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Etapa eliminada");
            onUpdate();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleColorChange = async (stage: CRMStage, colorValue: string) => {
        // Optimistic
        const updated = stages.map(s => s.id === stage.id ? { ...s, color: colorValue } : s);
        setStages(updated);

        const res = await updateStage(stage.id, { color: colorValue });
        if (res.error) toast.error("Error al actualizar color");
        else onUpdate();
    };

    const handleNameBlur = async (stage: CRMStage, newName: string) => {
        if (stage.name === newName || !newName.trim()) return;

        const res = await updateStage(stage.id, { name: newName });
        if (res.error) toast.error("Error al renombrar");
        else {
            toast.success("Nombre actualizado");
            onUpdate();
        }
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(stages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setStages(items); // Optimistic

        // Update positions based on new index
        const res = await reorderStages(items);
        if (res.error) {
            toast.error("Error al reordenar");
            setStages(initialStages); // Revert
        } else {
            onUpdate();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Editar Etapas
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Gestionar Pipeline</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 py-4">
                    <Input
                        placeholder="Nueva etapa..."
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-1">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="stages">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                >
                                    {stages.map((stage, index) => (
                                        <Draggable key={stage.id} draggableId={stage.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50 group"
                                                >
                                                    <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>

                                                    {/* Color Picker Popover/Dropdown roughly implemented as circles */}
                                                    <div className="flex gap-1">
                                                        {PRESET_COLORS.map((c) => (
                                                            <button
                                                                key={c.name}
                                                                className={cn(
                                                                    "w-4 h-4 rounded-full transition-all",
                                                                    getBgColorClass(c.value),
                                                                    stage.color === c.value ? "ring-2 ring-offset-1 ring-offset-background ring-white" : "opacity-30 hover:opacity-100"
                                                                )}
                                                                onClick={() => handleColorChange(stage, c.value)}
                                                                title={c.name}
                                                            />
                                                        ))}
                                                    </div>

                                                    <Input
                                                        defaultValue={stage.name}
                                                        className="h-8 bg-transparent border-transparent hover:border-border focus:border-primary transition-colors"
                                                        onBlur={(e) => handleNameBlur(stage, e.target.value)}
                                                    />

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDelete(stage.id, stage.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </DialogContent>
        </Dialog>
    );
}
