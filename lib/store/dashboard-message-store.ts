interface DashboardMessageState {
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
      purposePhrase:
        "Onde há visão, há propósito. Onde há propósito, há realização.",
      monthMessage: "Agosto é o nosso mês.",
      titleSize: "lg",
      setMessages: (msgs) => set((state) => ({ ...state, ...msgs })),
    }),
    { name: "ivs-dashboard-messages" }
  )
);