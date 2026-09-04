import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Receipt,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { LineChart, BarChart, DonutChart } from "@/components/Charts";
import type { CostBudget, RequestLog, UsageStat } from "@/types";

const DONUT_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

const COST_PER_1K: Record<string, number> = {
  "OpenAI": 0.005,
  "Anthropic": 0.003,
  "Google Gemini": 0.001,
  "Groq": 0.0001,
  "Cohere": 0.002,
  "OpenRouter": 0.002,
  "ChatGPT Browser": 0,
  "Gemini Browser": 0,
};

export function CostAnalysis() {
  const { t, theme, lang } = useApp();
  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/70 border-slate-200";
  const textSecondary = isDark ? "text-slate-500" : "text-slate-500";
  const inputClass = `w-full px-3.5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border ${isDark ? "border-slate-700" : "border-slate-300"} text-sm ${isDark ? "text-slate-100" : "text-slate-900"} focus:outline-none focus:border-cyan-500 transition-colors`;

  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [budgets, setBudgets] = useState<CostBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ name: "", period: "monthly" as const, limit_amount: "100", alert_threshold: "80" });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: logData }, { data: statData }, { data: budgetData }] = await Promise.all([
        supabase.from("request_logs").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("usage_stats").select("*").order("date", { ascending: false }).limit(30),
        supabase.from("cost_budgets").select("*").order("created_at", { ascending: true }),
      ]);
      setLogs((logData as RequestLog[]) ?? []);
      setStats((statData as UsageStat[]) ?? []);
      setBudgets((budgetData as CostBudget[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const avgCostPerRequest = logs.length > 0 ? totalCost / logs.length : 0;

  const costByProviderMap = new Map<string, number>();
  stats.forEach((s) => {
    const rate = COST_PER_1K[s.provider] ?? 0.001;
    const cost = (s.tokens_used / 1000) * rate;
    costByProviderMap.set(s.provider, (costByProviderMap.get(s.provider) ?? 0) + cost);
  });
  const costByProviderData = Array.from(costByProviderMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value: parseFloat(value.toFixed(4)), color: DONUT_COLORS[i % DONUT_COLORS.length] }));
  const totalDonutValue = costByProviderData.reduce((sum, d) => sum + d.value, 0);

  const costByModelMap = new Map<string, number>();
  logs.forEach((l) => {
    const model = l.model ?? "unknown";
    const rate = COST_PER_1K[l.provider] ?? 0.001;
    const cost = (l.tokens_used / 1000) * rate;
    costByModelMap.set(model, (costByModelMap.get(model) ?? 0) + cost);
  });
  const costByModelData = Array.from(costByModelMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value]) => ({ label, value: parseFloat(value.toFixed(4)) }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const costTrendData = last7Days.map((date) => {
    const dayStats = stats.filter((s) => s.date === date);
    const cost = dayStats.reduce((sum, s) => {
      const rate = COST_PER_1K[s.provider] ?? 0.001;
      return sum + (s.tokens_used / 1000) * rate;
    }, 0);
    return {
      label: new Date(date).toLocaleDateString("en", { weekday: "short" }),
      value: parseFloat(cost.toFixed(4)),
    };
  });

  function exportCSV() {
    setExporting(true);
    const headers = ["Date", "Provider", "Model", "Status", "Tokens", "Response Time (s)", "Cost ($)"];
    const rows = logs.map((l) => [
      new Date(l.created_at).toISOString(),
      l.provider,
      l.model ?? "",
      l.status,
      l.tokens_used.toString(),
      l.response_time != null ? l.response_time.toFixed(3) : "",
      (l.cost ?? 0).toFixed(6),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  async function saveBudget() {
    const payload = {
      name: budgetForm.name.trim(),
      period: budgetForm.period,
      limit_amount: parseFloat(budgetForm.limit_amount) || 100,
      alert_threshold: parseInt(budgetForm.alert_threshold) || 80,
      enabled: true,
    };
    if (editingBudgetId) {
      await supabase.from("cost_budgets").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingBudgetId);
    } else {
      await supabase.from("cost_budgets").insert(payload);
    }
    setBudgetForm({ name: "", period: "monthly", limit_amount: "100", alert_threshold: "80" });
    setEditingBudgetId(null);
    setShowAddBudget(false);
    const { data } = await supabase.from("cost_budgets").select("*").order("created_at", { ascending: true });
    setBudgets((data as CostBudget[]) ?? []);
  }

  async function deleteBudget(b: CostBudget) {
    if (!confirm(`${t("deleteConfirm")}?`)) return;
    await supabase.from("cost_budgets").delete().eq("id", b.id);
    setBudgets(budgets.filter((x) => x.id !== b.id));
  }

  function editBudget(b: CostBudget) {
    setEditingBudgetId(b.id);
    setBudgetForm({ name: b.name, period: b.period, limit_amount: b.limit_amount.toString(), alert_threshold: b.alert_threshold.toString() });
    setShowAddBudget(true);
  }


  const statCards = [
    { label: t("totalCost"), value: `$${totalCost.toFixed(4)}`, icon: DollarSign, color: "emerald" },
    { label: t("avgCostPerRequest"), value: `$${avgCostPerRequest.toFixed(6)}`, icon: Receipt, color: "cyan" },
    { label: t("costPerRequest"), value: logs.length.toString(), icon: TrendingUp, color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    emerald: isDark ? "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20" : "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-500/20",
    cyan: isDark ? "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20" : "from-cyan-500/10 to-cyan-500/5 text-cyan-600 border-cyan-500/20",
    amber: isDark ? "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20" : "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-500/20",
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("costAnalysisTitle")}</h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>{t("costAnalysisSubtitle")}</p>
        </div>
        <button onClick={exportCSV} disabled={exporting || loading} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors disabled:opacity-50">
          {exported ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {exported ? t("costExported") : t("exportCostData")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`bg-gradient-to-br ${colorMap[card.color]} border rounded-xl p-5 backdrop-blur-xl`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium truncate">{card.label}</p>
                  <p className="text-xl lg:text-2xl font-bold mt-2 text-white truncate">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colorMap[card.color]} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost trend + Cost by provider donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardBg} rounded-xl p-6 backdrop-blur-xl border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("costTrend")}</h2>
              <p className={`text-xs mt-1 ${textSecondary}`}>{t("last7Days")}</p>
            </div>
            <DollarSign className={`w-5 h-5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
          </div>
          {loading ? (
            <div className="h-40 bg-slate-800/40 rounded-lg animate-pulse" />
          ) : (
            <LineChart data={costTrendData} color={isDark ? "#10b981" : "#059669"} height={180} />
          )}
        </div>

        <div className={`${cardBg} rounded-xl p-6 backdrop-blur-xl border`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("costByProvider")}</h2>
              <p className={`text-xs mt-1 ${textSecondary}`}>{t("costBreakdownDesc")}</p>
            </div>
            <BarChart3 className={`w-5 h-5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
          </div>
          {loading ? (
            <div className="h-40 bg-slate-800/40 rounded-lg animate-pulse" />
          ) : totalDonutValue === 0 ? (
            <p className={`text-sm text-center py-12 ${textSecondary}`}>{t("noUsageData")}</p>
          ) : (
            <div className="flex flex-col items-center">
              <DonutChart data={costByProviderData} size={140} />
              <div className="w-full mt-4 space-y-1.5">
                {costByProviderData.slice(0, 5).map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className={isDark ? "text-slate-300" : "text-slate-700"}>{d.label}</span>
                    </div>
                    <span className={`text-xs font-mono ${textSecondary}`}>${d.value.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cost by model */}
      <div className={`${cardBg} rounded-xl p-6 backdrop-blur-xl border`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("costByModel")}</h2>
            <p className={`text-xs mt-1 ${textSecondary}`}>{t("costBreakdownDesc")}</p>
          </div>
          <BarChart3 className={`w-5 h-5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
        </div>
        {loading ? (
          <div className="h-40 bg-slate-800/40 rounded-lg animate-pulse" />
        ) : costByModelData.length === 0 || costByModelData.every((d) => d.value === 0) ? (
          <p className={`text-sm text-center py-12 ${textSecondary}`}>{t("noUsageData")}</p>
        ) : (
          <BarChart data={costByModelData} color={isDark ? "#8b5cf6" : "#7c3aed"} height={180} />
        )}
      </div>

      {/* Budget Alerts */}
      <div className={`${cardBg} rounded-xl border backdrop-blur-xl overflow-hidden`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("budgetAlerts")}</h2>
              <p className={`text-xs mt-0.5 ${textSecondary}`}>{t("budgetAlertsDesc")}</p>
            </div>
          </div>
          <button onClick={() => { setEditingBudgetId(null); setBudgetForm({ name: "", period: "monthly", limit_amount: "100", alert_threshold: "80" }); setShowAddBudget(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />{t("addBudget")}
          </button>
        </div>
        <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
          {loading ? (
            <div className="p-6"><div className="h-20 bg-slate-800/40 rounded-lg animate-pulse" /></div>
          ) : budgets.length === 0 ? (
            <p className={`text-sm text-center py-12 ${textSecondary}`}>{t("noBudgets")}</p>
          ) : (
            budgets.map((b) => {
              const usedPct = b.limit_amount > 0 ? (b.current_amount / b.limit_amount) * 100 : 0;
              const isWarning = usedPct >= b.alert_threshold && usedPct < 100;
              const isExceeded = usedPct >= 100;
              const remaining = Math.max(0, b.limit_amount - b.current_amount);
              return (
                <div key={b.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{b.name}</h3>
                        <p className={`text-xs ${textSecondary}`}>{b.period === "daily" ? t("daily") : b.period === "weekly" ? t("weekly") : t("monthly")}</p>
                      </div>
                      {isExceeded && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-500">
                          <AlertTriangle className="w-3 h-3" />{t("budgetExceeded")}
                        </span>
                      )}
                      {isWarning && !isExceeded && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500">
                          <AlertTriangle className="w-3 h-3" />{t("budgetWarning")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => editBudget(b)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{t("edit")}</button>
                      <button onClick={() => deleteBudget(b)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, usedPct)}%` }} />
                    </div>
                    <span className={`text-xs font-mono w-12 text-end ${textSecondary}`}>{usedPct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={textSecondary}>{t("budgetCurrent")}: <span className="font-mono text-slate-300">${b.current_amount.toFixed(2)}</span></span>
                    <span className={textSecondary}>{t("budgetRemaining")}: <span className="font-mono text-slate-300">${remaining.toFixed(2)}</span></span>
                    <span className={textSecondary}>{t("budgetLimit")}: <span className="font-mono text-slate-300">${b.limit_amount.toFixed(2)}</span></span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit budget modal */}
      {showAddBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddBudget(false)}>
          <div className={`w-full max-w-md ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border rounded-2xl shadow-2xl animate-scale-in`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <h2 className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{editingBudgetId ? t("editBudget") : t("addBudget")}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t("budgetName")}</label>
                <input type="text" value={budgetForm.name} onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })} className={inputClass} placeholder="Monthly API Budget" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t("budgetPeriod")}</label>
                <select value={budgetForm.period} onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value as "daily" | "weekly" | "monthly" })} className={inputClass}>
                  <option value="daily">{t("daily")}</option>
                  <option value="weekly">{t("weekly")}</option>
                  <option value="monthly">{t("monthly")}</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t("budgetLimit")}</label>
                <input type="number" step="0.01" value={budgetForm.limit_amount} onChange={(e) => setBudgetForm({ ...budgetForm, limit_amount: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t("budgetThreshold")}</label>
                <input type="number" min="0" max="100" value={budgetForm.alert_threshold} onChange={(e) => setBudgetForm({ ...budgetForm, alert_threshold: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <button onClick={() => setShowAddBudget(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{t("cancel")}</button>
              <button onClick={saveBudget} disabled={!budgetForm.name.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {editingBudgetId ? t("saveChanges") : t("addBudget")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
