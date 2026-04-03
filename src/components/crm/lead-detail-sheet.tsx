"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Lead } from "@/types";
import { LeadForm } from "./lead-form";

interface LeadDetailSheetProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
    if (!lead) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Detalle del Lead</SheetTitle>
                    <SheetDescription>
                        Edita la información y gestiona el seguimiento.
                    </SheetDescription>
                </SheetHeader>

                <LeadForm
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    lead={lead as any}
                    leadId={lead.id}
                    onSuccess={() => onOpenChange(false)}
                />

                {/* Future: Activity Log / Comments section here */}
            </SheetContent>
        </Sheet>
    );
}
