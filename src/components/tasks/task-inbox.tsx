"use client";

import { useState } from "react";
import { createTask } from "@/actions/tasks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TaskInbox() {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        const res = await createTask({ titulo: title });
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            setTitle("");
            toast.success("Tarea guardada en Inbox");
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Capturar tarea rápida..."
                    className="pr-20 h-12 text-base glass shadow-lg border-primary/20 focus-visible:ring-primary/30"
                    autoFocus
                />
                <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !title.trim()}
                    className="absolute right-1.5 top-1.5 h-9"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Plus className="h-4 w-4 mr-1" />
                            Guardar
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
