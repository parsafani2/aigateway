import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Gauge,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import { LineChart } from "@/components/Charts";
import type { AnomalyEvent, Provider, RequestLog } from "@/types";

export function Monitoring() {
  const { t, theme, lang } = useApp();
  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/80 border-slate-200/80";
  const textSecondary = isDark ? "text-slate-500" : "text-slate-500";

  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: anomData }, { data: provData }, { data: logData }] = await Promise.all([
        supabase.from("anomaly_events").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("providers").select("*").order("priority", { ascending: true }),
        supabase.from("request_logs").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      setAnomalies((anomData as AnomalyEvent[]) ?? []);
      setProviders((provData as Provider[]) ?? []);
      setLogs((logData as RequestLog[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredAnomalies = anomalies.filter((a) => {
    if (filter === "unresolved") return !a.resolved;
    if (filter === "resolved") return a.resolved;
    return true;
  });

  const severityColors: Record<string, string> = {
    low: "text-emerald-500 bg-emerald-500/10",
    medium: "text-amber-500 bg-amber-500/10",
    high: "text-orange-500 bg-orange-500/10",
    critical: "text-rose-500 bg-rose-500/10",
  };

  const typeIcons: Record<string, typeof Activity> = {
    latency_spike: Clock,
    error_spike: XCircle,
    cost_spike: AlertTriangle,
    detection_signal: ShieldAlert,
    usage_pattern: TrendingUp,
  };

  const typeLabels: Record<string, string> = {
    latency_spike: t("latencySpike"),
    error_spike: t("errorSpike"),
    cost_spike: t("costSpike"),
    detection_signal: t("detectionSignal"),
    usage_pattern: t("usagePatternAnomaly"),
  };

  async function resolveAnomaly(a: AnomalyEvent) {
    await supabase.from("anomaly_events").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", a.id);
    setAnomalies(anomalies.map((x) => x.id === a.id ? { ...x, resolved: true, resolved_at: new Date().toISOString() } : x));
  }

  // Real-time health status per provider
  const providerHealth = providers.map((p) => {
    const pLogs = logs.filter((l) => l.provider === p.name);
    const success = pLogs.filter((l) => l.status === "success");
    const errors = pLogs.filter((l) => l.status === "error");
    const successRate = pLogs.length > 0 ? (success.length / pLogs.length) * 100 : 100;
    const avgResponse = success.length > 0
      ? success.reduce((sum, l) => sum + (l.response_time ?? 0), 0) / success.length
      : 0;
    const healthScore = successRate >= 95 && avgResponse < 2 ? 100
      : successRate >= 90 && avgResponse < 3 ? 85
      : successRate >= 80 ? 60
      : 30;
    return { name: p.name, status: p.status, healthScore, successRate, avgResponse, total: pLogs.length, errors: errors.length };
  });

  // Response time trend (last 20 successful requests)
  const responseTimeData = logs
    .filter((l) => l.status === "success" && l.response_time != null)
    .slice(0, 20)
    .reverse()
    .map((l) => ({
      label: new Date(l.created_at).toLocaleTimeString(lang === "fa" ? "fa" : "en", { hour: "2-digit", minute: "2-digit" }),
      value: l.response_time as number,
    }));

  const healthyProviders = providerHealth.filter((p) => p.healthScore >= 85).length;
  const degradedProviders = providerHealth.filter((p) => p.healthScore >= 50 && p.healthScore < 85).length;
  const criticalProviders = providerHealth.filter((p) => p.healthScore < 50).length;

  const locale = lang === "fa" ? "fa" : "en";

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("monitoringTitle")}</h1>
        <p className={`text-sm mt-1 ${textSecondary}`}>{t("monitoringSubtitle")}</p>
      </div>

      {/* Health summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("healthStatus"), value: `${healthyProviders}/${providerHealth.length}`, icon: CheckCircle2, color: "emerald" },
          { label: t("degraded"), value: degradedProviders, icon: AlertTriangle, color: "amber" },
          { label: t("critical"), value: criticalProviders, icon: XCircle, color: "rose" },
          { label: t("unresolved"), value: anomalies.filter((a) => !a.resolved).length, icon: ShieldAlert, color: "cyan" },
        ].map((card) => {
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            emerald: isDark ? "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20" : "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-500/20",
            amber: isDark ? "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20" : "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-500/20",
            rose: isDark ? "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20" : "from-rose-500/10 to-rose-500/5 text-rose-600 border-rose-500/20",
            cyan: isDark ? "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20" : "from-cyan-500/10 to-cyan-500/5 text-cyan-600 border-cyan-500/20",
          };
          return (
            <div key={card.label} className={`bg-gradient-to-br ${colorMap[card.color]} border rounded-xl p-5 backdrop-blur-xl`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{card.label}</p>
                  <p className="text-2xl font-bold mt-2 text-white">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colorMap[card.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time provider health */}
      <div className={`${cardBg} rounded-xl p-6 border backdrop-blur-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("realtimeHealth")}</h2>
            <p className={`text-xs mt-1 ${textSecondary}`}>{t("realtimeHealthDesc")}</p>
          </div>
          <Activity className={`w-5 h-5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
        </div>
        <div className="space-y-3">
          {providerHealth.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${p.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{p.name}</span>
                <span className={`text-xs ${textSecondary}`}>{p.total} {t("requests")}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-mono ${p.successRate >= 90 ? "text-emerald-500" : p.successRate >= 70 ? "text-amber-500" : "text-rose-500"}`}>{p.successRate.toFixed(1)}%</span>
                <span className={`text-xs font-mono ${textSecondary}`}>{p.avgResponse.toFixed(2)}s</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.healthScore >= 85 ? "bg-emerald-500" : p.healthScore >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${p.healthScore}%` }} />
                  </div>
                  <span className={`text-xs font-mono w-10 text-end ${textSecondary}`}>{p.healthScore.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response time tracking */}
      <div className={`${cardBg} rounded-xl p-6 border backdrop-blur-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("responseTimeTracking")}</h2>
            <p className={`text-xs mt-1 ${textSecondary}`}>{t("responseTimeTrackingDesc")}</p>
          </div>
          <Gauge className={`w-5 h-5 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
        </div>
        {loading ? (
          <div className="h-40 bg-slate-800/40 rounded-lg animate-pulse" />
        ) : responseTimeData.length === 0 ? (
          <p className={`text-sm text-center py-12 ${textSecondary}`}>{t("noUsageData")}</p>
        ) : (
          <LineChart data={responseTimeData} color={isDark ? "#06b6d4" : "#0891b2"} height={180} />
        )}
      </div>

      {/* Anomaly detection */}
      <div className={`${cardBg} rounded-xl border backdrop-blur-xl overflow-hidden`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("anomalyDetectionTitle")}</h2>
              <p className={`text-xs mt-0.5 ${textSecondary}`}>{t("anomalyDetectionDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(["all", "unresolved", "resolved"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                {f === "all" ? t("allAnomalies") : f === "unresolved" ? t("unresolved") : t("resolved")}
              </button>
            ))}
          </div>
        </div>
        <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
          {loading ? (
            <div className="p-6"><div className="h-20 bg-slate-800/40 rounded-lg animate-pulse" /></div>
          ) : filteredAnomalies.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className={`text-sm ${textSecondary}`}>{t("noAnomalies")}</p>
            </div>
          ) : (
            filteredAnomalies.map((a) => {
              const Icon = typeIcons[a.type] ?? Activity;
              return (
                <div key={a.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className={`p-2 rounded-lg ${severityColors[a.severity] ?? severityColors.medium} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{typeLabels[a.type] ?? a.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[a.severity] ?? severityColors.medium}`}>
                        {a.severity === "low" ? t("low") : a.severity === "medium" ? t("medium") : a.severity === "high" ? t("high") : t("critical")}
                      </span>
                      {a.provider && <span className={`text-xs ${textSecondary}`}>· {a.provider}</span>}
                    </div>
                    {a.description && <p className={`text-xs mt-1 ${textSecondary}`}>{a.description}</p>}
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                      {a.metric_value != null && <span>{t("anomalyMetric")}: <span className="font-mono">{a.metric_value.toFixed(2)}</span></span>}
                      {a.expected_value != null && <span>{t("anomalyExpected")}: <span className="font-mono">{a.expected_value.toFixed(2)}</span></span>}
                      <span>{new Date(a.created_at).toLocaleString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  {!a.resolved && (
                    <button onClick={() => resolveAnomaly(a)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors flex-shrink-0">
                      {t("resolveAnomaly")}
                    </button>
                  )}
                  {a.resolved && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-500 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />{t("resolved")}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
