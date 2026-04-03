"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLead, updateLeadInfo } from "@/actions/leads";
import { LeadEstado, LeadFormData } from "@/types";
import { LEAD_TEMPERATURAS } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { CRMStage } from "@/actions/crm-config";

interface LeadFormProps {
    lead?: LeadFormData & { id?: string }; // Hybrid type for edit
    leadId?: string;
    stages: CRMStage[];
    onSuccess?: () => void;
}

export function LeadForm({ lead, leadId, stages, onSuccess }: LeadFormProps) {
    const [loading, setLoading] = useState(false);
    const isEdit = !!lead;

    // Sort stages by position just in case
    const sortedStages = [...stages].sort((a, b) => a.position - b.position);

    async function handleSubmit(formData: FormData) {
        setLoading(true);

        const data = {
            prospecto: formData.get("prospecto") as string,
            contacto: formData.get("contacto") as string,
            whatsapp: formData.get("whatsapp") as string,
            email: formData.get("email") as string,
            temperatura: formData.get("temperatura") as any,
            ticket_estimado: Number(formData.get("ticket_estimado")),
            servicio_interes: formData.get("servicio_interes") as string,
            // Use dynamic stage or default to first one
            estado: (formData.get("estado") as string) || sortedStages[0]?.name || "Inbox",
            proximo_paso: formData.get("proximo_paso") as string,
        };

        let result;
        if (isEdit && leadId) {
            result = await updateLeadInfo(leadId, data);
        } else {
            result = await createLead(data);
        }

        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(isEdit ? "Lead actualizado" : "Lead creado");
            onSuccess?.();
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="prospecto">Prospecto / Empresa <span className="text-red-400">*</span></Label>
                    <Input id="prospecto" name="prospecto" defaultValue={lead?.prospecto} required placeholder="Ej. Tech Solutions" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="estado">Etapa Inicial</Label>
                    <Select name="estado" defaultValue={lead?.estado || sortedStages[0]?.name || "Inbox"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar Etapa" />
                        </SelectTrigger>
                        <SelectContent>
                            {sortedStages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="contacto">Nombre Contacto</Label>
                    <Input id="contacto" name="contacto" defaultValue={lead?.contacto} placeholder="Ej. Juan Pérez" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="temperatura">Temperatura</Label>
                    <Select name="temperatura" defaultValue={lead?.temperatura || "🧊 Frío"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {LEAD_TEMPERATURAS.map((temp) => (
                                <SelectItem key={temp} value={temp}>{temp}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" name="whatsapp" defaultValue={lead?.whatsapp} placeholder="+54911..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={lead?.email} placeholder="juan@empresa.com" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ticket_estimado">Valor Estimado (USD)</Label>
                    <Input id="ticket_estimado" name="ticket_estimado" type="number" defaultValue={lead?.ticket_estimado} placeholder="1000" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="servicio_interes">Servicio de Interés</Label>
                    <Input id="servicio_interes" name="servicio_interes" defaultValue={lead?.servicio_interes} placeholder="Ej. Chatbot IA" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="proximo_paso">Próximo Paso</Label>
                <Textarea id="proximo_paso" name="proximo_paso" defaultValue={lead?.proximo_paso} placeholder="Ej. Enviar propuesta el martes..." />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? "Guardar Cambios" : "Crear Lead"}
                </Button>
            </div>
        </form>
    );
}
