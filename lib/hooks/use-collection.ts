"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Hook genérico de CRUD que fala com /api/data/[sheet].
 * Cada módulo (clientes, negocios, contratos, agenda, etc) usa o mesmo hook,
 * só trocando o nome da planilha (sheet).
 *
 * Toda falha (de rede ou vinda da API) aparece como um toast de erro com a
 * mensagem real - nunca fica em silêncio.
 */

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function useCollection<T extends { id: string }>(sheet: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data/${sheet}`, { cache: "no-store" });
      if (!res.ok) {
        const message = await parseError(res, "Não foi possível carregar os dados.");
        toast.error(message);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      console.error("[use-collection] refresh", sheet, err);
      toast.error(`Não foi possível conectar à API (${sheet}). O servidor "npm run dev" está rodando?`);
    } finally {
      setLoading(false);
    }
  }, [sheet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload: Omit<T, "id">) => {
      try {
        const res = await fetch(`/api/data/${sheet}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const message = await parseError(res, "Erro ao criar registro.");
          toast.error(message);
          return null;
        }
        const data = await res.json();
        setItems((prev) => [...prev, data.item]);
        toast.success("Criado com sucesso!");
        return data.item as T;
      } catch (err) {
        console.error("[use-collection] create", sheet, err);
        toast.error("Não foi possível conectar à API para criar o registro.");
        return null;
      }
    },
    [sheet]
  );

  const update = useCallback(
    async (id: string, payload: Partial<T>) => {
      try {
        const res = await fetch(`/api/data/${sheet}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const message = await parseError(res, "Erro ao salvar alterações.");
          toast.error(message);
          return null;
        }
        const data = await res.json();
        setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
        toast.success("Alterações salvas!");
        return data.item as T;
      } catch (err) {
        console.error("[use-collection] update", sheet, err);
        toast.error("Não foi possível conectar à API para salvar as alterações.");
        return null;
      }
    },
    [sheet]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/data/${sheet}/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const message = await parseError(res, "Erro ao excluir.");
          toast.error(message);
          return false;
        }
        setItems((prev) => prev.filter((it) => it.id !== id));
        toast.success("Excluído.");
        return true;
      } catch (err) {
        console.error("[use-collection] remove", sheet, err);
        toast.error("Não foi possível conectar à API para excluir.");
        return false;
      }
    },
    [sheet]
  );

  return { items, loading, refresh, create, update, remove };
}
