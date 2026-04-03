"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProject } from "@/actions/projects";
import { ProjectDeveloper, ProjectFormData } from "@/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProjectFormProps {
    onSuccess?: () => void;
}

const DEVELOPERS: ProjectDeveloper[] = ["Tomás", "Erwin"];

export function ProjectForm({ onSuccess }: ProjectFormProps) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);

        const data: ProjectFormData = {
            nombre: formData.get("nombre") as string,
            developer: formData.get("developer") as ProjectDeveloper || null,
            fecha_entrega: formData.get("fecha_entrega") as string || undefined,
            // status default is Onboarding
        };

        const result = await createProject(data);

        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Proyecto creado");
            onSuccess?.();
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Proyecto <span className="text-red-400">*</span></Label>
                <Input id="nombre" name="nombre" required placeholder="Ej. E-commerce V1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="developer">Desarrollador</Label>
                    <Select name="developer">
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {DEVELOPERS.map((dev) => (
                                <SelectItem key={dev} value={dev}>{dev}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fecha_entrega">Fecha de Entrega</Label>
                    <Input id="fecha_entrega" name="fecha_entrega" type="date" />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Proyecto
                </Button>
            </div>
        </form>
    );
}
