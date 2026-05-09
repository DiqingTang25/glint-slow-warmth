import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/glint/AppShell";

export const Route = createFileRoute("/companion")({
  component: () => (
    <AppShell>
      <div className="space-y-3 animate-fade-up text-center" style={{ paddingTop: 60 }}>
        <div style={{ fontSize: 56 }}>🤝</div>
        <h1 className="text-2xl font-semibold">同频陪伴</h1>
        <p className="text-sm text-muted-foreground">
          这个房间还在筹备中。下一个版本，你将能寄出第一封慢信笺。
        </p>
      </div>
    </AppShell>
  ),
});
