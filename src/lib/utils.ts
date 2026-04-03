import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy", { locale: es });
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function getWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}`;
}

export function getDaysSinceContact(lastContact: string | Date | null): number | null {
  if (!lastContact) return null;
  const diff = Date.now() - new Date(lastContact).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
