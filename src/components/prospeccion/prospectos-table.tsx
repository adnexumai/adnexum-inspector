"use client";

import { useState, useTransition } from "react";
import { Prospecto, updateProspecto } from "@/actions/prospeccion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Sparkles } from "lucide-react";

const ESTADO_COLORS: Record<string, string> = {
    enviado: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    respondio: "bg-green-500/15 text-green-400 border-green-500/30",
    seguimiento: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    cerrado_positivo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cerrado_negativo: "bg-red-500/15 text-red-400 border-red-500/30",
};

const ESTADO_LABELS: Record<string, string> = {
    enviado: "Enviado",
    respondio: "Respondió",
    seguimiento: "Seguimiento",
    cerrado_positivo: "Cerrado ✓",
    cerrado_negativo: "Cerrado ✗",
};

function formatFecha(iso: string) {
    return format(new Date(iso), "dd MMM · HH:mm", { locale: es });
}

export function ProspectosTable({ prospectos: initial }: { prospectos: Prospecto[] }) {
    const [prospectos, setProspectos] = useState(initial);
    const [editando, setEditando] = useState<Prospecto | null>(null);
    const [form, setForm] = useState({ negocio: "", estado: "", notas: "" });
    const [isPending, startTransition] = useTransition();
    
    // Filtros
    const [filtroNegocio, setFiltroNegocio] = useState("");
    const [filtroScore, setFiltroScore] = useState<string>("todos");

    // Lógica de filtrado en cliente
    const prospectosFiltrados = prospectos.filter(p => {
        let regex = null;
        try { regex = filtroNegocio ? new RegExp(filtroNegocio, 'i') : null; } catch (e) {}
        const matchNegocio = regex ? regex.test(p.negocio || "") : true;
        
        let matchScore = true;
        if (filtroScore === "alto") matchScore = (p.oportunidad_score || 0) >= 8;
        if (filtroScore === "medio") matchScore = (p.oportunidad_score || 0) >= 4 && (p.oportunidad_score || 0) < 8;
        if (filtroScore === "bajo") matchScore = (p.oportunidad_score !== undefined && p.oportunidad_score < 4);
        
        return matchNegocio && matchScore;
    });

    function abrirEdicion(p: Prospecto) {
        setEditando(p);
        setForm({ negocio: p.negocio || "", estado: p.estado, notas: p.notas || "" });
    }

    function guardar() {
        if (!editando) return;
        startTransition(async () => {
            const res = await updateProspecto(editando.telefono, form);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Guardado");
                setProspectos((prev) =>
                    prev.map((p) =>
                        p.telefono === editando.telefono
                            ? { ...p, ...form, estado: form.estado as Prospecto["estado"] }
                            : p
                    )
                );
                setEditando(null);
            }
        });
    }

    if (!prospectos.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-sm">No hay prospectos aún.</p>
                <p className="text-xs mt-1">Se registrarán automáticamente cuando envíes mensajes de WhatsApp.</p>
            </div>
        );
    }

    return (
        <>
            {/* Controles de Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar negocio..." 
                        className="pl-8 h-9 text-sm focus-visible:ring-1"
                        value={filtroNegocio}
                        onChange={(e) => setFiltroNegocio(e.target.value)}
                    />
                </div>
                <Select value={filtroScore} onValueChange={setFiltroScore}>
                    <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm">
                        <SelectValue placeholder="Filtrar por Score" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los Scores</SelectItem>
                        <SelectItem value="alto">Alto (8 - 10)</SelectItem>
                        <SelectItem value="medio">Medio (4 - 7)</SelectItem>
                        <SelectItem value="bajo">Bajo (0 - 3)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                        <tr>
                            {["Teléfono", "Negocio", "Estado", "Score IA", "Primer contacto", "Último contacto", "Msgs", ""].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {prospectosFiltrados.map((p) => (
                            <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.telefono}</td>
                                <td className="px-4 py-3 font-medium">
                                    {p.negocio || <span className="text-muted-foreground/50 italic">Sin nombre</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge className={`text-[11px] border ${ESTADO_COLORS[p.estado]}`} variant="outline">
                                        {ESTADO_LABELS[p.estado] || p.estado}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    {p.oportunidad_score !== undefined && p.oportunidad_score !== null ? (
                                        <div className="flex items-center gap-1">
                                            <span className={`font-semibold ${p.oportunidad_score >= 8 ? 'text-emerald-400' : p.oportunidad_score >= 4 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                                                {p.oportunidad_score}/10
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground/40 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{formatFecha(p.primer_contacto)}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{formatFecha(p.ultimo_contacto)}</td>
                                <td className="px-4 py-3 text-center text-xs">{p.mensajes_enviados}</td>
                                <td className="px-4 py-3">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => abrirEdicion(p)}>
                                        Editar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar prospecto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Teléfono</Label>
                            <p className="font-mono text-sm text-muted-foreground">{editando?.telefono}</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="negocio">Nombre del negocio</Label>
                            <Input
                                id="negocio"
                                value={form.negocio}
                                onChange={(e) => setForm((f) => ({ ...f, negocio: e.target.value }))}
                                placeholder="Ej: La Keso, BBM Solutions..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="estado">Estado</Label>
                            <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
                                <SelectTrigger id="estado">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ESTADO_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {(editando?.resumen_ia || editando?.siguiente_paso) && (
                            <div className="p-3 bg-muted/40 rounded-md border border-border mt-2 space-y-3">
                                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                                    <Sparkles className="w-4 h-4" /> Inteligencia Artificial Adnexum
                                </div>
                                {editando.resumen_ia && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Resumen Conversación</Label>
                                        <p className="text-sm mt-1">{editando.resumen_ia}</p>
                                    </div>
                                )}
                                {editando.siguiente_paso && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Sugerencia de Respuesta</Label>
                                        <div className="text-sm mt-1 p-2 bg-background border border-border rounded italic text-foreground/80">
                                            {editando.siguiente_paso}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="notas">Notas Internas</Label>
                            <Textarea
                                id="notas"
                                value={form.notas}
                                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                                placeholder="Contexto del prospecto..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
                        <Button onClick={guardar} disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
