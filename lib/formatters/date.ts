import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDatePtBR(d: Date | string): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}
