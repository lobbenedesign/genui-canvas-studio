/**
 * 📊 5-Competitor Benchmark Matrix for Generative UI Studios
 * Compares GenUI-Canvas Studio against:
 * 1. v0.dev (Vercel)
 * 2. wandb / thesysdev OpenUI
 * 3. tldraw make-real
 * 4. Bolt.new (StackBlitz)
 * 5. Lovable.dev
 */

export interface GenUICompetitor {
  name: string;
  infiniteCanvas: boolean;
  liveIframeSandbox: boolean;
  localOfflineRunning: boolean;
  exportReactVueHTML: boolean;
  costMonthly: string;
  multiComponentWorkspace: boolean;
}

export class GenUICompetitorBenchmark {
  public getComparison(): GenUICompetitor[] {
    return [
      {
        name: "🎨 GenUI-Canvas Studio (Our Software)",
        infiniteCanvas: true,
        liveIframeSandbox: true,
        localOfflineRunning: true,
        exportReactVueHTML: true,
        costMonthly: "$0.00 (Local Bun)",
        multiComponentWorkspace: true
      },
      {
        name: "v0.dev (Vercel)",
        infiniteCanvas: false,
        liveIframeSandbox: true,
        localOfflineRunning: false,
        exportReactVueHTML: true,
        costMonthly: "$20.00 / month",
        multiComponentWorkspace: false
      },
      {
        name: "wandb / thesysdev OpenUI",
        infiniteCanvas: false,
        liveIframeSandbox: true,
        localOfflineRunning: true,
        exportReactVueHTML: false,
        costMonthly: "$0.00",
        multiComponentWorkspace: false
      },
      {
        name: "tldraw make-real",
        infiniteCanvas: true,
        liveIframeSandbox: true,
        localOfflineRunning: false,
        exportReactVueHTML: false,
        costMonthly: "Pay-per-token API",
        multiComponentWorkspace: true
      },
      {
        name: "Bolt.new (StackBlitz)",
        infiniteCanvas: false,
        liveIframeSandbox: true,
        localOfflineRunning: false,
        exportReactVueHTML: true,
        costMonthly: "$20.00 / month",
        multiComponentWorkspace: false
      },
      {
        name: "Lovable.dev",
        infiniteCanvas: false,
        liveIframeSandbox: true,
        localOfflineRunning: false,
        exportReactVueHTML: true,
        costMonthly: "$20.00 / month",
        multiComponentWorkspace: false
      }
    ];
  }
}
