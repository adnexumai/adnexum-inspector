"use client";

import { useState } from "react";
import { signIn, signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const action = isSignUp ? signUp : signIn;
        const result = await action(formData);

        if (result && "error" in result && result.error) {
            setError(result.error);
        }
        if (result && "success" in result && result.success) {
            setSuccess(result.success);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background glow effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-[128px]" />
            </div>

            <Card className="w-full max-w-md glass-card border-0 animate-fade-in relative z-10">
                <CardHeader className="space-y-4 items-center text-center">
                    {/* Logo */}
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary">
                        <Zap className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            <span className="text-gradient">Adnexum</span>{" "}
                            <span className="text-muted-foreground font-light">OS</span>
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {isSignUp
                                ? "Crea una cuenta para acceder al sistema"
                                : "Ingresa a tu sistema de gestión"}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tomas@adnexum.com"
                                required
                                autoComplete="email"
                                className="bg-secondary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                className="bg-secondary/50"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-red-400 animate-fade-in">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-emerald-400 animate-fade-in">
                                {success}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    {isSignUp ? "Creando cuenta..." : "Ingresando..."}
                                </span>
                            ) : isSignUp ? (
                                "Crear cuenta"
                            ) : (
                                "Iniciar sesión"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {isSignUp
                                ? "¿Ya tenés cuenta? Inicia sesión"
                                : "¿No tenés cuenta? Registrate"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
