"use client";

import { useState, useRef } from "react";
import { ProjectFile } from "@/types";
import { uploadProjectFile, deleteProjectFile } from "@/actions/files";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image as ImageIcon, Trash2, Upload, Download, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";

interface DocumentManagerProps {
    projectId: string;
    files: ProjectFile[];
}

export function DocumentManager({ projectId, files }: DocumentManagerProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            await handleUpload(e.target.files[0]);
        }
    }

    async function handleUpload(file: File) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        const res = await uploadProjectFile(formData);

        if (res.error) {
            toast.error("Error al subir archivo: " + res.error);
        } else {
            toast.success("Archivo subido correctamente");
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function handleDelete(fileId: string) {
        if (!confirm("¿Seguro que quieres eliminar este archivo?")) return;

        const res = await deleteProjectFile(fileId, projectId);
        if (res.error) {
            toast.error("Error al eliminar: " + res.error);
        } else {
            toast.success("Archivo eliminado");
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleUpload(e.dataTransfer.files[0]);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes("image")) return <ImageIcon className="h-8 w-8 text-blue-400" />;
        if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-400" />;
        return <File className="h-8 w-8 text-gray-400" />;
    };

    return (
        <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Archivos del Proyecto</CardTitle>
                <div
                    className={cn(
                        "relative flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition-colors cursor-pointer hover:bg-white/5",
                        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                        {isUploading ? "Subiendo..." : "Subir archivo (o arrastrar)"}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {files.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-border">
                        <File className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No hay archivos adjuntos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => (
                            <div key={file.id} className="group relative flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/10 hover:bg-secondary/30 transition-all">
                                <div className="shrink-0 pt-1">
                                    {getFileIcon(file.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate" title={file.name}>{file.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {formatDate(file.created_at)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
                                        title="Descargar"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
