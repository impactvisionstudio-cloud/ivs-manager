"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadSheetButton({ label = "Baixar planilha" }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        window.location.href = "/api/data/export";
      }}
    >
      <Download className="h-4 w-4" /> {label}
    </Button>
  );
}
