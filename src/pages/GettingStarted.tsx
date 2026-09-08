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
  Activity,
  ShieldAlert,
  Users,
  FlaskConical,
  ScrollText,
  DollarSign,
  Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/contexts/AppContext";
import type { Lang } from "@/i18n";

interface TutorialProgress {
  id: string;
  tutorial_id: string;
  completed: boolean;
  completed_at: string | null;
}

interface FaqItem { q: string; a: string; }

const tutorialContent: Record<Lang, {
  steps: Record<string, string[]>;
  faq: FaqItem[];
  prerequisites: string[];
  codeExamples: Record<string, string>;
}> = {
  en: {
    steps: {
      tutorial1: [
        "Navigate to the Providers page from the sidebar menu.",
        "Click the 'Add Provider' button in the top right corner.",
        "Enter a name for your provider (e.g., 'OpenAI', 'Anthropic').",
        "Select the type: 'API Key' for paid providers or 'Token-Free' for browser-based access.",
        "If API Key type, enter your API key in the secure field.",
        "Add the models this provider supports (comma-separated, e.g., 'gpt-4o,gpt-4o-mini').",
        "Set the priority number — lower numbers are tried first.",
        "Click 'Save Changes' to activate the provider.",
      ],
      tutorial2: [
        "Go to Settings and note your Access Code (or set a new one).",
        "Open the API Docs page to see code examples in multiple languages.",
        "Use the Playground page to test interactively without writing code.",
        "For programmatic access, use the base URL: https://aigateway.hooshedigital.ir/v1",
        "Set your Authorization header: 'Bearer YOUR_ACCESS_CODE'",
        "Send a POST request to /v1/chat/completions with model and messages.",
        "The gateway will route to the best provider automatically.",
        "Check the Request Logs page to see your request logged.",
      ],
      tutorial3: [
        "Go to Settings and ensure 'Fallback Enabled' is set to true.",
        "On the Providers page, arrange providers by priority (lower = higher priority).",
        "Each provider should have its supported models listed.",
        "When a request comes in, the gateway tries the highest-priority provider first.",
        "If that provider fails or rate-limits, it falls back to the next provider.",
        "Only providers that support the requested model are tried.",
        "Visit the Risk Monitor page to see provider health scores.",
        "High-risk providers are automatically deprioritized in routing.",
      ],
      tutorial4: [
        "Go to the Sessions page from the sidebar.",
        "Click 'Add Session' to add a browser token or cookie.",
        "Select the provider (ChatGPT Browser, Gemini Browser, or Claude Browser).",
        "Give your session an account name (e.g. \"ChatGPT Account #1\") to manage multiple accounts.",
        "To get a ChatGPT token: open chatgpt.com, log in, press F12, go to Application > Local Storage, copy the accessToken value.",
        "To get a Gemini token: open gemini.google.com, log in, press F12, go to Application > Cookies, copy the cookie values.",
        "To get a Claude token: open claude.ai, log in, press F12, go to Network tab, find an API request, copy the sessionKey from cookies.",
        "Paste the token into the token field. Optionally set a User-Agent and IP address for anti-detection.",
        "Set an expiration date if the token has a known expiry (usually 7-14 days).",
        "Add multiple accounts for the same provider to distribute load and avoid rate limits.",
        "Use 'Rotate' to cycle to the next available session — the old one is expired and the next active one takes over.",
        "Monitor session health on the Sessions dashboard — low health scores indicate detection risk.",
      ],
      tutorial5: [
        "Navigate to the Cost Analysis page from the sidebar.",
        "Click 'Add Budget' to create a new spending budget.",
        "Choose a period: daily, weekly, or monthly.",
        "Set the limit amount in dollars.",
        "Set the alert threshold percentage (e.g., 80% to get warned at 80% of budget).",
        "The gateway will track spending against your budget automatically.",
        "Use 'Export CSV' to download detailed cost data for accounting.",
        "Monitor the cost trend chart to spot spending spikes early.",
      ],
      tutorial6: [
        "Navigate to the Monitoring page from the sidebar.",
        "View the Real-time Health Status section for live provider status.",
        "Check the Response Time Tracking table for latency metrics per provider.",
        "Look at the Anomaly Detection section for automatically detected issues.",
        "Anomalies include latency spikes, error spikes, cost spikes, and detection signals.",
        "Click 'Resolve' on anomalies you have addressed.",
        "Use the anomaly filter to view all, unresolved, or resolved issues.",
        "Set up alert configuration to be notified of anomalies via webhook or email.",
      ],
      tutorial7: [
        "Go to the Risk Monitor page from the sidebar.",
        "Review the Provider Scoring System showing risk scores per provider.",
        "Risk scores are calculated from success rate, response time, and error patterns.",
        "Check the Detection Signals column for signs of provider blocking.",
        "Use Smart Routing to let the gateway route based on real-time risk scores.",
        "Enable Auto-Quarantine to automatically isolate critical-risk providers.",
        "Enable Predictive Fallback to switch providers before failure based on trends.",
        "Review the Risk Score History chart to spot degrading providers early.",
      ],
      tutorial8: [
        "Navigate to the Users page from the sidebar.",
        "Click 'Add User' to create a new API user.",
        "Enter the user's email address.",
        "Assign a role: 'Admin' for full access or 'Viewer' for read-only.",
        "An API key is automatically generated for the new user.",
        "Use 'Copy Key' to copy the API key to share with the user.",
        "Use 'Regenerate Key' if a key needs to be rotated.",
        "Use 'Disable' or 'Enable' to control user access without deleting.",
      ],
      tutorial9: [
        "Navigate to the Playground page from the sidebar.",
        "Select a model from the dropdown at the top.",
        "Add or edit messages — set each message role to system, user, or assistant.",
        "Adjust the temperature slider (0 = focused, 2 = creative).",
        "Set max tokens to control response length.",
        "Click 'Send' to submit the request through the gateway.",
        "View the response, response time, tokens used, and provider used.",
        "Use the copy button on the response to copy it to your clipboard.",
      ],
      tutorial10: [
        "Navigate to the Audit Logs page from the sidebar.",
        "Review the activity timeline for all administrative actions.",
        "Each log entry shows the action, entity, who performed it, and details.",
        "Use this to track who created, edited, or deleted providers, users, and settings.",
        "Audit logs help with compliance and security investigations.",
        "Check the Notifications bell in the sidebar for recent alerts.",
        "Use 'Mark all as read' to clear notification badges.",
        "Combine with the Request Logs page for a complete activity picture.",
      ],
      tutorial11: [
        "Navigate to the Cost Analysis page from the sidebar.",
        "Review the Cost per Request and Total Cost summary cards.",
        "Check the Cost by Provider chart to see which providers cost the most.",
        "Check the Cost by Model chart to compare spending across models.",
        "View the Cost Trend chart to track spending over time.",
        "Create budgets with daily, weekly, or monthly periods.",
        "Set alert thresholds to be notified before overspending.",
        "Click 'Export CSV' to download all cost data for accounting or analysis.",
      ],
      tutorial12: [
        "Navigate to the Settings page from the sidebar.",
        "Set or update your Access Code — this is the Bearer token for API calls.",
        "Configure the Rate Limit to control maximum requests per minute per client.",
        "Set CORS Origins to control which domains can access your gateway.",
        "Set the Gateway Name for display purposes.",
        "Configure the Default Model used when no model is specified in requests.",
        "Toggle Fallback Enabled to control automatic provider fallback.",
        "Switch between Dark and Light mode, and between English and Persian.",
      ],
    },
    faq: [
      { q: "What is the AI Gateway?", a: "The AI Gateway is a unified API proxy that routes requests to multiple AI providers (OpenAI, Anthropic, Gemini, etc.) with automatic fallback, cost tracking, and risk monitoring." },
      { q: "Do I need an API key for every provider?", a: "No. Some providers offer token-free access through browser sessions. You can also mix API key providers with token-free ones." },
      { q: "How does fallback work?", a: "When a provider fails or rate-limits, the gateway automatically tries the next provider in priority order that supports the requested model. This happens transparently — your client just sees the successful response." },
      { q: "Can I use the OpenAI SDK?", a: "Yes. The gateway is fully compatible with the OpenAI API format. Set the base URL to the gateway URL and use your access code as the API key." },
      { q: "How are costs calculated?", a: "Costs are estimated based on token usage and per-provider pricing rates. You can configure budgets and export cost data as CSV for detailed analysis." },
      { q: "What is anomaly detection?", a: "The monitoring system automatically detects unusual patterns like latency spikes, error rate increases, cost spikes, and detection signals — helping you catch issues before they impact users." },
      { q: "Is my data secure?", a: "All API keys and session tokens are stored securely in the database with row-level security. The access code is sent as a Bearer token for authentication." },
      { q: "Can I monitor providers in real time?", a: "Yes. The Monitoring page shows live health status, response time tracking, and anomaly detection for all configured providers." },
      { q: "What is risk scoring?", a: "Risk scoring evaluates each provider based on success rate, response time, and error patterns. High-risk providers are automatically deprioritized, and critical ones can be auto-quarantined." },
      { q: "How do browser sessions work?", a: "Browser sessions allow you to use token-free providers by storing browser cookies or tokens. The gateway rotates sessions to avoid detection and monitors their health automatically." },
      { q: "Can I export my data?", a: "Yes. Cost data can be exported as CSV from the Cost Analysis page. Request logs are viewable in the Logs page with full details." },
      { q: "What languages does the gateway support?", a: "The gateway dashboard supports English and Persian (Farsi). You can switch languages from the sidebar or the settings page. The API itself is language-agnostic." },
    ],
    prerequisites: [
      "A running AI Gateway instance (already deployed)",
      "At least one AI provider API key or browser session token",
      "An access code configured in Settings",
      "Basic familiarity with HTTP APIs (or use the Playground for testing)",
    ],
    codeExamples: {
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
    },
  },
  fa: {
    steps: {
      tutorial1: [
        "از منوی کناری به صفحه ارائه‌دهندگان بروید.",
        "دکمه «افزودن ارائه‌دهنده» در گوشه بالا سمت راست کلیک کنید.",
        "نامی برای ارائه‌دهنده وارد کنید (مثلاً «OpenAI» یا «Anthropic»).",
        "نوع را انتخاب کنید: «کلید API» برای ارائه‌دهنده‌های پولی یا «بدون توکن» برای دسترسی مبتنی بر مرورگر.",
        "اگر نوع کلید API را انتخاب کردید، کلید API خود را در فیلد امن وارد کنید.",
        "مدل‌های پشتیبانی‌شده را با کاما جدا کنید (مثلاً 'gpt-4o,gpt-4o-mini').",
        "عدد اولویت را تنظیم کنید — اعداد کمتر اول امتحان می‌شوند.",
        "روی «ذخیره تغییرات» کلیک کنید تا ارائه‌دهنده فعال شود.",
      ],
      tutorial2: [
        "به صفحه تنظیمات بروید و کد دسترسی خود را یادداشت کنید (یا کد جدیدی تنظیم کنید).",
        "صفحه مستندات API را باز کنید تا نمونه کدها به چند زبان را ببینید.",
        "از صفحه آزمایشگاه برای تست تعاملی بدون نوشتن کد استفاده کنید.",
        "برای دسترسی برنامه‌نویسی، از آدرس پایه استفاده کنید: https://aigateway.hooshedigital.ir/v1",
        "هدر Authorization را تنظیم کنید: 'Bearer YOUR_ACCESS_CODE'",
        "یک درخواست POST به /v1/chat/completions با مدل و پیام‌ها ارسال کنید.",
        "دروازه به‌طور خودکار به بهترین ارائه‌دهنده مسیریابی می‌کند.",
        "صفحه لاگ درخواست‌ها را بررسی کنید تا درخواست خود را ثبت‌شده ببینید.",
      ],
      tutorial3: [
        "به صفحه تنظیمات بروید و مطمئن شوید «فعال‌سازی Fallback» روی true تنظیم شده.",
        "در صفحه ارائه‌دهندگان، ارائه‌دهنده‌ها را بر اساس اولویت مرتب کنید (کمتر = اولویت بالاتر).",
        "هر ارائه‌دهنده باید مدل‌های پشتیبانی‌شده خود را لیست کرده باشد.",
        "وقتی درخواستی وارد می‌شود، دروازه ابتدا ارائه‌دهنده با بالاترین اولویت را امتحان می‌کند.",
        "اگر آن ارائه‌دهنده خطا دهد یا محدودیت نرخ بخورد، به ارائه‌دهنده بعدیFallback می‌شود.",
        "فقط ارائه‌دهنده‌هایی که مدل درخواست شده را پشتیبانی می‌کنند امتحان می‌شوند.",
        "صفحه پایش ریسک را ببینید تا امتیاز سلامت ارائه‌دهنده‌ها را بررسی کنید.",
        "ارائه‌دهنده‌های پرخطر به‌طور خودکار در مسیریابی کم‌اولویت می‌شوند.",
      ],
      tutorial4: [
        "از منوی کناری به صفحه نشست‌ها بروید.",
        "روی «افزودن نشست» کلیک کنید تا توکن یا کوکی مرورگر اضافه کنید.",
        "ارائه‌دهنده را انتخاب کنید (ChatGPT Browser، Gemini Browser یا Claude Browser).",
        "برای نشست یک نام حساب انتخاب کنید (مثلاً «حساب ChatGPT #۱») تا چندین حساب را مدیریت کنید.",
        "برای گرفتن توکن ChatGPT: سایت chatgpt.com را باز کنید، وارد شوید، F12 بزنید، به Application > Local Storage بروید و مقدار accessToken را کپی کنید.",
        "برای گرفتن توکن Gemini: سایت gemini.google.com را باز کنید، وارد شوید، F12 بزنید، به Application > Cookies بروید و مقادیر کوکی را کپی کنید.",
        "برای گرفتن توکن Claude: سایت claude.ai را باز کنید، وارد شوید، F12 بزنید، به تب Network بروید، یک درخواست API پیدا کنید و sessionKey را از کوکی‌ها کپی کنید.",
        "توکن را در فیلد توکن جای‌گذاری کنید. اختیاریاً User-Agent و آدرس IP را برای ضد تشخیص تنظیم کنید.",
        "اگر توکن تاریخ انقضا دارد، تاریخ انقضا را تنظیم کنید (معمولاً ۷ تا ۱۴ روز).",
        "برای هر ارائه‌دهنده چند حساب اضافه کنید تا بار توزیع شود و از محدودیت نرخ جلوگیری شود.",
        "از «چرخش» برای جابه‌جایی به نشست بعدی استفاده کنید — نشست قدیمی منقضی و نشست فعال بعدی جایگزین می‌شود.",
        "سلامت نشست را در داشبورد نشست‌ها پایش کنید — امتیاز سلامت پایین نشان‌دهنده ریسک تشخیص است.",
      ],
      tutorial5: [
        "از منوی کناری به صفحه تحلیل هزینه بروید.",
        "روی «افزودن بودجه» کلیک کنید تا بودجه جدید ایجاد کنید.",
        "دوره را انتخاب کنید: روزانه، هفتگی یا ماهانه.",
        "مبلغ محدودیت را به دلار تنظیم کنید.",
        "درصد آستانه هشدار را تنظیم کنید (مثلاً ۸۰٪ برای هشدار در ۸۰٪ بودجه).",
        "دروازه به‌طور خودکار هزینه‌ها را در برابر بودجه شما پیگیری می‌کند.",
        "از «خروجی CSV» برای دانلود داده‌های هزینه برای حسابداری استفاده کنید.",
        "نمودار روند هزینه را پایش کنید تا افزایش هزینه‌ها را زود تشخیص دهید.",
      ],
      tutorial6: [
        "از منوی کناری به صفحه پایش بروید.",
        "بخش وضعیت سلامت بلادرنگ را برای وضعیت زنده ارائه‌دهنده ببینید.",
        "جدول پیگیری زمان پاسخ را برای معیارهای تأخیر هر ارائه‌دهنده بررسی کنید.",
        "بخش تشخیص ناهنجاری را برای مشکلات کشف‌شده خودکار ببینید.",
        "ناهنجاری‌ها شامل افزایش تأخیر، افزایش خطا، افزایش هزینه و سیگنال‌های تشخیص هستند.",
        "روی «حل» کلیک کنید تا ناهنجاری‌های برطرف‌شده را علامت بزنید.",
        "از فیلتر ناهنجاری برای مشاهده همه، حل‌نشده یا حل‌شده استفاده کنید.",
        "پیکربندی هشدار را تنظیم کنید تا ناهنجاری‌ها از طریق webhook یا ایمیل اطلاع داده شوند.",
      ],
      tutorial7: [
        "از منوی کناری به صفحه پایش ریسک بروید.",
        "سیستم امتیازدهی ارائه‌دهنده را که امتیاز ریسک هر ارائه‌دهنده را نشان می‌دهد بررسی کنید.",
        "امتیازهای ریسک از نرخ موفقیت، زمان پاسخ و الگوهای خطا محاسبه می‌شوند.",
        "ستون سیگنال‌های تشخیص را برای نشانه‌های مسدودسازی ارائه‌دهنده بررسی کنید.",
        "از مسیریابی هوشمند استفاده کنید تا دروازه بر اساس امتیاز ریسک بلادرنگ مسیریابی کند.",
        "قرنطینه خودکار را فعال کنید تا ارائه‌دهنده‌های بحرانی خودکار قرنطینه شوند.",
        "Fallback پیش‌بینانه را فعال کنید تا قبل از شکست، ارائه‌دهنده عوض شود.",
        "نمودار تاریخچه امتیاز ریسک را بررسی کنید تا ارائه‌دهنده‌های در حال تحلیل‌رفته را زود ببینید.",
      ],
      tutorial8: [
        "از منوی کناری به صفحه کاربران بروید.",
        "روی «افزودن کاربر» کلیک کنید تا کاربر API جدید ایجاد کنید.",
        "آدرس ایمیل کاربر را وارد کنید.",
        "نقش اختصاص دهید: «مدیر» برای دسترسی کامل یا «بیننده» برای فقط خواندن.",
        "کلید API به‌طور خودکار برای کاربر جدید تولید می‌شود.",
        "از «کپی کلید» برای کپی کلید API و اشتراک با کاربر استفاده کنید.",
        "از «تولید مجدد کلید» اگر کلید نیاز به چرخش دارد استفاده کنید.",
        "از «غیرفعال‌سازی» یا «فعال‌سازی» برای کنترل دسترسی کاربر بدون حذف استفاده کنید.",
      ],
      tutorial9: [
        "از منوی کناری به صفحه آزمایشگاه بروید.",
        "یک مدل از منوی کشویی بالا انتخاب کنید.",
        "پیام‌ها را اضافه یا ویرایش کنید — نقش هر پیام را روی سیستم، کاربر یا دستیار تنظیم کنید.",
        "اسلایدر دما را تنظیم کنید (۰ = متمرکز، ۲ = خلاقانه).",
        "حداکثر توکن را برای کنترل طول پاسخ تنظیم کنید.",
        "روی «ارسال» کلیک کنید تا درخواست از طریق دروازه ارسال شود.",
        "پاسخ، زمان پاسخ، توکن‌های استفاده‌شده و ارائه‌دهنده استفاده‌شده را ببینید.",
        "از دکمه کپی روی پاسخ برای کپی به کلیپ‌بورد استفاده کنید.",
      ],
      tutorial10: [
        "از منوی کناری به صفحه لاگ ممیزی بروید.",
        "تایم‌لاین فعالیت برای تمام عملیات مدیریتی را بازبینی کنید.",
        "هر ورودی لاگ، عملیات، موجودیت، انجام‌دهنده و جزئیات را نشان می‌دهد.",
        "از این بخش برای پیگیری اینکه چه کسی ارائه‌دهنده، کاربر و تنظیمات را ایجاد، ویرایش یا حذف کرده استفاده کنید.",
        "لاگ‌های ممیزی برای انطباق و تحقیقات امنیتی مفید هستند.",
        "زنگ اعلان‌ها در منوی کناری را برای هشدارهای اخیر بررسی کنید.",
        "از «علامت‌گذاری همه به‌عنوان خوانده‌شده» برای پاک کردن نشان اعلان‌ها استفاده کنید.",
        "ترکیب با صفحه لاگ درخواست‌ها برای تصویر کامل فعالیت.",
      ],
      tutorial11: [
        "از منوی کناری به صفحه تحلیل هزینه بروید.",
        "کارت‌های خلاصه هزینه هر درخواست و کل هزینه را بررسی کنید.",
        "نمودار هزینه بر اساس ارائه‌دهنده را ببینید تا پرهزینه‌ترین ارائه‌دهنده‌ها را شناسایی کنید.",
        "نمودار هزینه بر اساس مدل را برای مقایسه هزینه بین مدل‌ها بررسی کنید.",
        "نمودار روند هزینه را برای پیگیری هزینه در طول زمان ببینید.",
        "بودجه با دوره روزانه، هفتگی یا ماهانه ایجاد کنید.",
        "آستانه هشدار را تنظیم کنید تا قبل از هزینه بیش از حد اطلاع داده شود.",
        "روی «خروجی CSV» کلیک کنید تا تمام داده‌های هزینه برای حسابداری یا تحلیل دانلود شود.",
      ],
      tutorial12: [
        "از منوی کناری به صفحه تنظیمات بروید.",
        "کد دسترسی خود را تنظیم یا به‌روز کنید — این توکن Bearer برای فراخوانی‌های API است.",
        "محدودیت نرخ را پیکربندی کنید تا حداکثر درخواست در دقیقه برای هر کلاینت کنترل شود.",
        "مبدأهای CORS را تنظیم کنید تا کنترل کنید کدام دامنه‌ها به دروازه دسترسی دارند.",
        "نام دروازه را برای نمایش تنظیم کنید.",
        "مدل پیش‌فرض را پیکربندی کنید که وقتی در درخواست مدلی مشخص نشده استفاده می‌شود.",
        "Fallback فعال را کنترل کنید تا Fallback خودکار ارائه‌دهنده روشن یا خاموش شود.",
        "بین حالت تاریک و روشن، و بین انگلیسی و فارسی جابه‌جا شوید.",
      ],
    },
    faq: [
      { q: "دروازه هوش مصنوعی چیست؟", a: "دروازه هوش مصنوعی یک پراکسی API یکپارچه است که درخواست‌ها را به چندین ارائه‌دهنده هوش مصنوعی (OpenAI، Anthropic، Gemini و غیره) با Fallback خودکار، پیگیری هزینه و پایش ریسک مسیریابی می‌کند." },
      { q: "آیا برای هر ارائه‌دهنده به کلید API نیاز دارم؟", a: "خیر. برخی ارائه‌دهنده‌ها دسترسی بدون توکن از طریق نشست‌های مرورگر ارائه می‌دهند. همچنین می‌توانید ارائه‌دهنده‌های کلید API را با ارائه‌دهنده‌های بدون توکن ترکیب کنید." },
      { q: "Fallback چگونه کار می‌کند؟", a: "وقتی یک ارائه‌دهنده خطا می‌دهد یا محدودیت نرخ می‌خورد، دروازه به‌طور خودکار ارائه‌دهنده بعدی را که مدل درخواست شده را پشتیبانی می‌کند امتحان می‌کند. این به‌صورت شفاف انجام می‌شود — کلاینت شما فقط پاسخ موفق را می‌بیند." },
      { q: "آیا می‌توانم از OpenAI SDK استفاده کنم؟", a: "بله. دروازه کاملاً با فرمت OpenAI API سازگار است. آدرس پایه را به آدرس دروازه تنظیم کنید و از کد دسترسی به عنوان کلید API استفاده کنید." },
      { q: "هزینه‌ها چگونه محاسبه می‌شوند؟", a: "هزینه‌ها بر اساس استفاده توکن و نرخ‌های قیمت‌گذاری هر ارائه‌دهنده تخمین زده می‌شوند. می‌توانید بودجه پیکربندی کنید و داده‌های هزینه را به صورت CSV برای تحلیل دقیق خروجی بگیرید." },
      { q: "تشخیص ناهنجاری چیست؟", a: "سیستم پایش به‌طور خودکار الگوهای غیرعادی مانند افزایش تأخیر، افزایش نرخ خطا، افزایش هزینه و سیگنال‌های تشخیص را شناسایی می‌کند — کمک می‌کند مشکلات را قبل از تأثیر بر کاربران شناسایی کنید." },
      { q: "آیا داده‌های من امن است؟", a: "تمام کلیدهای API و توکن‌های نشست به‌طور امن در پایگاه داده با امنیت در سطح ردیف ذخیره می‌شوند. کد دسترسی به عنوان توکن Bearer برای احراز هویت ارسال می‌شود." },
      { q: "آیا می‌توانم ارائه‌دهنده‌ها را در زمان واقعی پایش کنم؟", a: "بله. صفحه پایش وضعیت سلامت زنده، پیگیری زمان پاسخ و تشخیص ناهنجاری برای تمام ارائه‌دهنده‌های پیکربندی‌شده را نشان می‌دهد." },
      { q: "امتیازدهی ریسک چیست؟", a: "امتیازدهی ریسک هر ارائه‌دهنده را بر اساس نرخ موفقیت، زمان پاسخ و الگوهای خطا ارزیابی می‌کند. ارائه‌دهنده‌های پرخطر به‌طور خودکار کم‌اولویت می‌شوند و بحرانی‌ها می‌توانند خودکار قرنطینه شوند." },
      { q: "نشست‌های مرورگر چگونه کار می‌کنند؟", a: "نشست‌های مرورگر به شما اجازه می‌دهند از ارائه‌دهنده‌های بدون توکن با ذخیره کوکی یا توکن مرورگر استفاده کنید. دروازه نشست‌ها را برای جلوگیری از تشخیص چرخش می‌دهد و سلامت آن‌ها را خودکار پایش می‌کند." },
      { q: "آیا می‌توانم داده‌های خود را خروجی بگیرم؟", a: "بله. داده‌های هزینه را می‌توان به صورت CSV از صفحه تحلیل هزینه خروجی گرفت. لاگ‌های درخواست در صفحه لاگ‌ها با جزئیات کامل قابل مشاهده هستند." },
      { q: "دروازه از چه زبان‌هایی پشتیبانی می‌کند؟", a: "داشبورد دروازه از انگلیسی و فارسی پشتیبانی می‌کند. می‌توانید از منوی کناری یا صفحه تنظیمات زبان را تغییر دهید. خود API مستقل از زبان است." },
    ],
    prerequisites: [
      "یک نمونه دروازه هوش مصنوعی در حال اجرا (قبلاً نصب شده)",
      "حداقل یک کلید API ارائه‌دهنده هوش مصنوعی یا توکن نشست مرورگر",
      "یک کد دسترسی پیکربندی‌شده در تنظیمات",
      "آشنایی اولیه با APIهای HTTP (یا از آزمایشگاه برای تست استفاده کنید)",
    ],
    codeExamples: {
      curl: `curl -X POST https://aigateway.hooshedigital.ir/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_ACCESS_CODE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "سلام!"}]
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
        "messages": [{"role": "user", "content": "سلام!"}]
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
      messages: [{ role: "user", content: "سلام!" }]
    })
  }
);
const data = await response.json();
console.log(data.choices[0].message.content);`,
    },
  },
};

export function GettingStarted() {
  const { t, theme, lang } = useApp();
  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white/80 border-slate-200/80";
  const textSecondary = isDark ? "text-slate-500" : "text-slate-600";
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

  const content = tutorialContent[lang];

  const tutorials = [
    { id: "tutorial1", titleKey: "tutorial1Title" as const, descKey: "tutorial1Desc" as const, icon: Server },
    { id: "tutorial2", titleKey: "tutorial2Title" as const, descKey: "tutorial2Desc" as const, icon: Code2 },
    { id: "tutorial3", titleKey: "tutorial3Title" as const, descKey: "tutorial3Desc" as const, icon: Zap },
    { id: "tutorial4", titleKey: "tutorial4Title" as const, descKey: "tutorial4Desc" as const, icon: Globe },
    { id: "tutorial5", titleKey: "tutorial5Title" as const, descKey: "tutorial5Desc" as const, icon: Wallet },
    { id: "tutorial6", titleKey: "tutorial6Title" as const, descKey: "tutorial6Desc" as const, icon: Activity },
    { id: "tutorial7", titleKey: "tutorial7Title" as const, descKey: "tutorial7Desc" as const, icon: ShieldAlert },
    { id: "tutorial8", titleKey: "tutorial8Title" as const, descKey: "tutorial8Desc" as const, icon: Users },
    { id: "tutorial9", titleKey: "tutorial9Title" as const, descKey: "tutorial9Desc" as const, icon: FlaskConical },
    { id: "tutorial10", titleKey: "tutorial10Title" as const, descKey: "tutorial10Desc" as const, icon: ScrollText },
    { id: "tutorial11", titleKey: "tutorial11Title" as const, descKey: "tutorial11Desc" as const, icon: DollarSign },
    { id: "tutorial12", titleKey: "tutorial12Title" as const, descKey: "tutorial12Desc" as const, icon: Settings },
  ];

  const [activeTab, setActiveTab] = useState<string>("curl");
  const completedCount = Array.from(progress.values()).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("gettingStartedTitle")}</h1>
        <p className={`text-sm mt-1 ${textSecondary}`}>{t("gettingStartedSubtitle")}</p>
      </div>

      {/* Progress banner */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-5 h-5 text-cyan-500" />
          <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("gettingStarted")}</h2>
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
          <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("prerequisites")}</h2>
        </div>
        <p className={`text-sm mb-4 ${textSecondary}`}>{t("whatYouNeed")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {content.prerequisites.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tutorials */}
      <div className={`${cardBg} rounded-xl border border ${isDark ? "border-slate-800" : "border-slate-200"} backdrop-blur-xl overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("tutorials")}</h2>
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
                      {content.steps[tutorial.id].map((step, i) => (
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
            <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("codeExamplesTitle")}</h2>
          </div>
          <p className={`text-xs mt-1 ${textSecondary}`}>{t("codeExamplesDesc")}</p>
        </div>
        <div className={`flex items-center gap-1 px-4 pt-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"} pb-px overflow-x-auto scrollbar-thin`}>
          {Object.keys(content.codeExamples).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab ? `bg-slate-100 dark:bg-slate-800 ${isDark ? "text-slate-100" : "text-slate-800"} border-b-2 border-cyan-500` : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <pre className={`p-6 text-sm font-mono overflow-x-auto scrollbar-thin leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}><code>{content.codeExamples[activeTab]}</code></pre>
          <button onClick={() => copy(content.codeExamples[activeTab], activeTab)} className="absolute top-4 end-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {copied === activeTab ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className={`${cardBg} rounded-xl border backdrop-blur-xl overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-slate-500" />
            <h2 className={`font-semibold text-lg ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("faqSection")}</h2>
          </div>
          <p className={`text-xs mt-1 ${textSecondary}`}>{t("faqSectionDesc")}</p>
        </div>
        <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
          {content.faq.map((item, i) => (
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
