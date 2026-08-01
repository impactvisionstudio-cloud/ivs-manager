import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TitleSize = "sm" | "md" | "lg" | "xl";

interface DashboardMessageState {
  verseText: string;
  verseRef: string;
  purposePhrase: string;
  monthMessage: string;
  titleSize: TitleSize;
  setMessages: (
    msgs: Partial<Omit<DashboardMessageState, "setMessages">>
  ) => void;
}

export const useDashboardMessageStore = create<DashboardMessageState>()(
  persist(
    (set) => ({
      verseText:
        "O Senhor dos Exércitos jurou, dizendo: Como pensei, assim sucederá, e como determinei, assim se efetuará.",
      verseRef: "Is 14.24",
      purposePhrase:
        "Onde há visão, há propósito. Onde há propósito, há realização.",
      monthMessage: "Agosto é o nosso mês.",
      titleSize: "lg",
      setMessages: (msgs) => set((state) => ({ ...state, ...msgs })),
    }),
    { name: "ivs-dashboard-messages" }
  )
);