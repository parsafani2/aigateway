import { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  Rocket,
  Server,
  Code2,
  Zap,
  Globe,
  Wallet,
  Copy,
  Check,
  Terminal,
  HelpCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";

interface TutorialProgress {
  id: string;
  tutorial_id: string;
  completed: boolean;
  completed_at: string | null;
}

export function GettingStarted() {
  const { t, theme } = useApp();
  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/70 border-slate-200";
  const textSecondary = isDark ? "text-slate-500" : "text-slate-500";
  const [copied, setCopied] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map());
  const [openTutorial, setOpenTutorial] = useState<string | null>("tutorial1");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function fetchProgress() {
      const { data } = await supabase.from("getting_started_progress").select("*");
      const map = new Map<string, boolean>();
      (data as TutorialProgress[] | null)?.forEach((p) => map.set(p.tutorial_id, p.completed));
      setProgress(map);
    }
    fetchProgress();
  }, []);

  async function toggleComplete(tutorialId: string) {
    const isCompleted = progress.get(tutorialId) ?? false;
    const newCompleted = !isCompleted;
    const newMap = new Map(progress);
    newMap.set(tutorialId, newCompleted);
    setProgress(newMap);

    const { data: existing } = await supabase.from("getting_started_progress").select("*").eq("tutorial_id", tutorialId).maybeSingle();
    if (existing) {
      await supabase.from("getting_started_progress").update({ completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }).eq("id", (existing as TutorialProgress).id);
    } else {
      await supabase.from("getting_started_progress").insert({ tutorial_id: tutorialId, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null });
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const tutorials = [
    {
      id: "tutorial1",
      titleKey: "tutorial1Title" as const,
      descKey: "tutorial1Desc" as const,
      icon: Server,
      steps: [
        "Navigate to the Providers page from the sidebar menu.",
        "Click the 'Add Provider' button in the top right corner.",
        "Enter a name for your provider (e.g., 'OpenAI', 'Anthropic').",
        "Select the type: 'API Key' for paid providers or 'Token-Free' for browser-based access.",
        "If API Key type, enter your API key in the secure field.",
        "Add the models this provider supports (comma-separated, e.g., 'gpt-4o,gpt-4o-mini').",
        "Set the priority number — lower numbers are tried first.",
        "Click 'Save Changes' to activate the provider.",
      ],
    },
    {
      id: "tutorial2",
      titleKey: "tutorial2Title" as const,
      descKey: "tutorial2Desc" as const,
      icon: Code2,
      steps: [
        "Go to Settings and note your Access Code (or set a new one).",
        "Open the API Docs page to see code examples in multiple languages.",
        "Use the Playground page to test interactively without writing code.",
        "For programmatic access, use the base URL: https://aigateway.hooshedigital.ir/v1",
        "Set your Authorization header: 'Bearer YOUR_ACCESS_CODE'",
        "Send a POST request to /v1/chat/completions with model and messages.",
        "The gateway will route to the best provider automatically.",
        "Check the Request Logs page to see your request logged.",
      ],
    },
    {
      id: "tutorial3",
      titleKey: "tutorial3Title" as const,
      descKey: "tutorial3Desc" as const,
      icon: Zap,
      steps: [
        "Go to Settings and ensure 'Fallback Enabled' is set to true.",
        "On the Providers page, arrange providers by priority (lower = higher priority).",
        "Each provider should have its supported models listed.",
        "When a request comes in, the gateway tries the highest-priority provider first.",
        "If that provider fails or rate-limits, it falls back to the next provider.",
        "Only providers that support the requested model are tried.",
        "Visit the Risk Monitor page to see provider health scores.",
        "High-risk providers are automatically deprioritized in routing.",
      ],
    },
    {
      id: "tutorial4",
      titleKey: "tutorial4Title" as const,
      descKey: "tutorial4Desc" as const,
      icon: Globe,
      steps: [
        "Go to the Sessions page from the sidebar.",
        "Click 'Add Session' to add a browser token or cookie.",
        "Select the provider (ChatGPT Browser or Gemini Browser).",
        "Paste the session token or cookie value into the token field.",
        "Optionally set a User-Agent and IP address for anti-detection.",
        "Set an expiration date if the token has a known expiry.",
        "Use 'Rotate' to cycle session tokens and avoid detection.",
        "Monitor session health on the Sessions dashboard — low health scores indicate detection risk.",
      ],
    },
    {
      id: "tutorial5",
      titleKey: "tutorial5Title" as const,
      descKey: "tutorial5Desc" as const,
      icon: Wallet,
      steps: [
        "Navigate to the Cost Analysis page from the sidebar.",
        "Click 'Add Budget' to create a new spending budget.",
        "Choose a period: daily, weekly, or monthly.",
        "Set the limit amount in dollars.",
        "Set the alert threshold percentage (e.g., 80% to get warned at 80% of budget).",
        "The gateway will track spending against your budget automatically.",
        "Use 'Export CSV' to download detailed cost data for accounting.",
        "Monitor the cost trend chart to spot spending spikes early.",
      ],
    },
  ];

  const faqItems = [
    { q: "What is the AI Gateway?", a: "The AI Gateway is a unified API proxy that routes requests to multiple AI providers (OpenAI, Anthropic, Gemini, etc.) with automatic fallback, cost tracking, and risk monitoring." },
    { q: "Do I need an API key for every provider?", a: "No. Some providers offer token-free access through browser sessions. You can also mix API key providers with token-free ones." },
    { q: "How does fallback work?", a: "When a provider fails or rate-limits, the gateway automatically tries the next provider in priority order that supports the requested model. This happens transparently — your client just sees the successful response." },
    { q: "Can I use the OpenAI SDK?", a: "Yes. The gateway is fully compatible with the OpenAI API format. Set the base URL to the gateway URL and use your access code as the API key." },
    { q: "How are costs calculated?", a: "Costs are estimated based on token usage and per-provider pricing rates. You can configure budgets and export cost data as CSV for detailed analysis." },
    { q: "What is anomaly detection?", a: "The monitoring system automatically detects unusual patterns like latency spikes, error rate increases, cost spikes, and detection signals — helping you catch issues before they impact users." },
    { q: "Is my data secure?", a: "All API keys and session tokens are stored securely in the database with row-level security. The access code is sent as a Bearer token for authentication." },
    { q: "Can I monitor providers in real time?", a: "Yes. The Monitoring page shows live health status, response time tracking, and anomaly detection for all configured providers." },
  ];

  const prerequisites = [
    "A running AI Gateway instance (already deployed)",
    "At least one AI provider API key or browser session token",
    "An access code configured in Settings",
    "Basic familiarity with HTTP APIs (or use the Playground for testing)",
  ];

  const codeExamples: Record<string, string> = {
    curl: `curl -X POST https://aigateway.hooshedigital.ir/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_ACCESS_CODE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    python: `import requests

response = requests.post(
    "https://aigateway.hooshedigital.ir/v1/chat/completions",
    headers={
        "Authorization": "Bearer YOUR_ACCESS_CODE",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)
print(response.json()["choices"][0]["message"]["content"])`,
    javascript: `const response = await fetch(
  "https://aigateway.hooshedigital.ir/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_ACCESS_CODE",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello!" }]
    })
  }
);
const data = await response.json();
console.log(data.choices[0].message.content);`,
  };

  const [activeTab, setActiveTab] = useState<string>("curl");
  const completedCount = Array.from(progress.values()).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("gettingStartedTitle")}</h1>
        <p className={`text-sm mt-1 ${textSecondary}`}>{t("gettingStartedSubtitle")}</p>
      </div>

      {/* Progress banner */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-5 h-5 text-cyan-500" />
          <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("gettingStarted")}</h2>
          <span className="ms-auto text-sm text-slate-500">{completedCount}/{tutorials.length} {t("tutorialCompleted")}</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${(completedCount / tutorials.length) * 100}%` }} />
        </div>
      </div>

      {/* Prerequisites */}
      <div className={`${cardBg} rounded-xl p-6 border backdrop-blur-xl`}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-cyan-500" />
          <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("prerequisites")}</h2>
        </div>
        <p className={`text-sm mb-4 ${textSecondary}`}>{t("whatYouNeed")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prerequisites.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tutorials */}
      <div className={`${cardBg} rounded-xl border backdrop-blur-xl overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("tutorials")}</h2>
          <p className={`text-xs mt-1 ${textSecondary}`}>{t("tutorialsDesc")}</p>
        </div>
        <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
          {tutorials.map((tutorial) => {
            const Icon = tutorial.icon;
            const isCompleted = progress.get(tutorial.id) ?? false;
            const isOpen = openTutorial === tutorial.id;
            return (
              <div key={tutorial.id}>
                <button
                  onClick={() => setOpenTutorial(isOpen ? null : tutorial.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-start hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-cyan-500/10 text-cyan-500"}`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{t(tutorial.titleKey)}</h3>
                      <p className={`text-xs mt-0.5 ${textSecondary}`}>{t(tutorial.descKey)}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 animate-fade-in">
                    <div className="space-y-3">
                      {tutorial.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{step}</p>
                        </div>
                      ))}
                      <button
                        onClick={() => toggleComplete(tutorial.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isCompleted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" : "bg-cyan-500 hover:bg-cyan-400 text-white"}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        {isCompleted ? t("tutorialCompleted") : t("tutorialMarkComplete")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Code examples */}
      <div className={`${cardBg} rounded-xl overflow-hidden border backdrop-blur-xl`}>
        <div className={`p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-500" />
            <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("codeExamplesTitle")}</h2>
          </div>
          <p className={`text-xs mt-1 ${textSecondary}`}>{t("codeExamplesDesc")}</p>
        </div>
        <div className={`flex items-center gap-1 px-4 pt-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"} pb-px overflow-x-auto scrollbar-thin`}>
          {Object.keys(codeExamples).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab ? `bg-slate-100 dark:bg-slate-800 ${isDark ? "text-slate-100" : "text-slate-900"} border-b-2 border-cyan-500` : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <pre className={`p-6 text-sm font-mono overflow-x-auto scrollbar-thin leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}><code>{codeExamples[activeTab]}</code></pre>
          <button onClick={() => copy(codeExamples[activeTab], activeTab)} className="absolute top-4 end-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {copied === activeTab ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className={`${cardBg} rounded-xl border backdrop-blur-xl overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-slate-500" />
            <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-900"}`}>{t("faqSection")}</h2>
          </div>
          <p className={`text-xs mt-1 ${textSecondary}`}>{t("faqSectionDesc")}</p>
        </div>
        <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
          {faqItems.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-start hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <span className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 animate-fade-in">
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
