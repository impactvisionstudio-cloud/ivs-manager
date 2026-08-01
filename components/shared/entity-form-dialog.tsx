"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export type FieldType = "text" | "number" | "currency" | "date" | "datetime-local" | "textarea" | "select" | "checkbox";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2;
}

function formatCurrencyDisplay(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyToNumber(display: unknown): number {
  const digits = String(display ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldConfig[];
  initialValues?: object;
  onSubmit: (values: Record<string, unknown>) => Promise<unknown> | unknown;
  submitLabel?: string;
}

export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialValues,
  onSubmit,
  submitLabel = "Salvar",
}: EntityFormDialogProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
  if (open) {
    const source = (initialValues ?? {}) as Record<string, unknown>;
    const defaults: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = source[f.name] ?? (f.type === "checkbox" ? false : "");
      defaults[f.name] =
        f.type === "currency" ? formatCurrencyDisplay(raw) : raw;
    }
    setValues(defaults);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, initialValues]);

  const setField = (name: string, value: unknown) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
     const payload: Record<string, unknown> = {};
      for (const f of fields) {
        if (f.type === "number") {
          payload[f.name] = Number(values[f.name] ?? 0);
        } else if (f.type === "currency") {
          payload[f.name] = parseCurrencyToNumber(values[f.name]);
        } else {
          payload[f.name] = values[f.name];
        }
      }
      const result = await onSubmit(payload);
      // create/update retornam null quando a chamada falha (e já mostram um
      // toast com o motivo) - nesse caso mantemos o formulário aberto para
      // o usuário poder tentar de novo sem perder o que digitou.
      if (result !== null) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error("[EntityFormDialog] onSubmit", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={f.colSpan === 1 ? "col-span-1 space-y-1.5" : "col-span-2 space-y-1.5"}>
              {f.type !== "checkbox" && (
                <Label htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="text-danger"> *</span>}
                </Label>
              )}

              {f.type === "textarea" && (
                <Textarea
                  id={f.name}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={(values[f.name] as string) ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}

              {f.type === "select" && (
                <Select
                  id={f.name}
                  required={f.required}
                  value={(values[f.name] as string) ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                >
                  <option value="" disabled>Selecione...</option>
                  {f.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              )}

              {f.type === "checkbox" && (
                <label className="flex items-center gap-2 pt-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary-600"
                    checked={Boolean(values[f.name])}
                    onChange={(e) => setField(f.name, e.target.checked)}
                  />
                  {f.label}
                </label>
              )}

              {f.type === "currency" && (
                <Input
                  id={f.name}
                  type="text"
                  inputMode="numeric"
                  required={f.required}
                  placeholder="0,00"
                  value={(values[f.name] as string) ?? ""}
                  onChange={(e) => setField(f.name, formatCurrencyDisplay(e.target.value))}
                />
              )}

              {(f.type === "text" || f.type === "number" || f.type === "date" || f.type === "datetime-local") && (
                <Input
                  id={f.name}
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={(values[f.name] as string | number) ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <DialogFooter className="col-span-2 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
