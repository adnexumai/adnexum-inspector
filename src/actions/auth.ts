"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signIn(formData: FormData) {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        });

        if (error) {
            console.error("Sign In Error:", error.message);
            return { error: error.message };
        }

        revalidatePath("/", "layout");
    } catch (err) {
        console.error("Unexpected error in signIn:", err);
        return { error: "Ocurrió un error inesperado al iniciar sesión." };
    }

    redirect("/");
}

export async function signUp(formData: FormData) {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: "Cuenta creada. Revisa tu email para confirmar." };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}
