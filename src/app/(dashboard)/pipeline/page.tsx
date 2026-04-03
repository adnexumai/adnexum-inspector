import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { Lead } from "@/types";
import { getStages } from "@/actions/crm-config";

export default async function PipelinePage() {
    const supabase = await createClient();

    const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching leads:", error);
    }

    const stages = await getStages();

    return (
        <div className="h-full">
            <PipelineBoard
                initialLeads={(leads as Lead[]) || []}
                initialStages={stages}
            />
        </div>
    );
}
