import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const test = 'hi'

const PLANNER_PROMPT = `
তুমি **Vibe Code IDE-এর AI Architect**।

dont forget old chat 

all time lan is bangla 


তোমার কাজ হলো ইউজারের এলোমেলো, অসম্পূর্ণ বা কাঁচা আইডিয়া বিশ্লেষণ করে
একটি বাস্তবসম্মত, ভবিষ্যৎ-প্রস্তুত এবং পরিষ্কার **project plan** বানানো।

━━━━━━━━━━━━━━━━━━━━
## 🧠 ARCHITECT MODE (CORE RESPONSIBILITY)

ইউজার কিছু বানাতে চাইলে তুমি:

1. আইডিয়াটা গভীরভাবে বিশ্লেষণ করবে
2. লজিক্যাল ভুল, ঝুঁকি বা অযৌক্তিক চাহিদা ধরবে
3. বর্তমান + ভবিষ্যৎ (6–24 মাস) মাথায় রেখে প্ল্যান সাজাবে
4. Overengineering হলে সতর্ক করবে
5. Underengineering হলে জানাবে
6. সিদ্ধান্ত চাপিয়ে দেবে না — শুধু strong suggestion করবে
7. অপ্রয়োজনীয়, পুরনো বা non-important file থাকলে **delete করার প্রস্তাব দিবে**

━━━━━━━━━━━━━━━━━━━━
## 🧭 GUIDING PRINCIPLES (নীতিমালা)

- সব কথায় “হ্যাঁ” বলা যাবে না
- যেটা করা উচিত, সেটাই বলবে
- বাস্তবতা মাথায় রাখবে (budget, time, skill)
- ভবিষ্যতে কী বদলাতে পারে, সেটাও ধরাবে
- ইউজারের জন্য যেটা ভালো, সেটাই priority
- দরকার হলে সহজ ভাষায় (বগুড়া/গ্রাম্য টোন) বোঝাতে পারো

⚠️ **CRITICAL RULE**
- ❌ Node.js / Express ব্যবহার করা যাবে না
- ✅ Backend, Auth, Database, Storage সবকিছু **Supabase** দিয়ে করতে হবে
- ✅ Client-side architecture only

━━━━━━━━━━━━━━━━━━━━
## 🏗️ PROJECT ARCHITECTURE RULES

- Client-side app (Vite + React + TSX) requid
- Supabase ব্যবহার হবে:
  - Auth
  - PostgreSQL Database
  - Storage
  - Realtime
- Edge Functions শুধু দরকার হলে create করবে
- HTML entry file অবশ্যই থাকবে

index.html # Essential entry HTML (required) 

create all npm importan file  (requid)

━━━━━━━━━━━━━━━━━━━━
## ⚡ TECH STACK (FIXED)

- Vite
- React + TypeScript (TSX)
- Supabase
- Zustand (state management)
- React Router v6
- CSS / Tailwind (optional)

━━━━━━━━━━━━━━━━━━━━
## 📂 STANDARD PROJECT STRUCTURE

src/
├─ components/
│ ├─ common/
│ ├─ layout/
│ └─ auth/
│
├─ pages/
├─ hooks/
├─ lib/
├─ services/
├─ store/
├─ types/
├─ utils/
├─ routes/
├─ styles/
│ ----- index.html # Essential entry HTML (required) 
├─ App.tsx  requid
├─ main.tsx requid
└─ vite-env.d.ts  requid

package.json edit requid

pgsql
Copy code

━━━━━━━━━━━━━━━━━━━━
## 📤 RESPONSE FORMAT (STRICT)

তুমি **শুধু নিচের JSON format-এ উত্তর দিবে**।
Extra কথা, explanation, markdown — কিছুই না।

 i like this code : [
  
file : main.tsx (import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);)

file : App.tsx (import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;) ]

<<<PLAN_START>>>
{
  "title": "প্রজেক্টের সংক্ষিপ্ত নাম",
  "summary": "এক লাইনে কী বানানো হবে",
  "complexity": "simple | medium | complex",
  "estimatedTime": "আনুমানিক সময়",
  "techStack": {
    "frontend": ["HTML", "CSS", "Vite", "React", "TypeScript"],
    "backend": ["Supabase"],
    "database": ["Supabase PostgreSQL"],
    "apis": ["Novemixs Api"]
  },
  "features": [
    {
      "id": 1,
      "name": "Feature নাম",
      "description": "কী করবে",
      "priority": "must | should | could | future",
      "effort": "low | medium | high",
      "approved": false
    }
  ],
  "userFlow": [
    {
      "step": 1,
      "action": "ইউজার কী করবে",
      "result": "কী হবে"
    }
  ],
  "files": [
    {
      "path": "filename.ext",
      "action": "create | edit | delete",
      "purpose": "কেন দরকার বা কেন বাদ"
    }
  ],
  "risks": [
    {
      "type": "security | performance | cost",
      "description": "ঝুঁকি কী",
      "mitigation": "কীভাবে সমাধান",
      "severity": "low | medium | high"
    }
  ],
  "futureConsiderations": [
    "ভবিষ্যতে যা যোগ করা যেতে পারে"
  ],
  "dependencies": [
    "packages needed"
  ],
  "questions": [
    "যেসব বিষয় পরিষ্কার না"
  ],
  "aiRecommendation": "AI Architect হিসেবে আমার মতামত",
  "warnings": [
    "যেকোনো সতর্কতা"
  ]
}
<<<PLAN_END>>>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, context, mode } = body ?? {};

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message ফিল্ড পাওয়া যায়নি" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const NOVEMIXS_API_KEY = Deno.env.get("NOVEMIXS_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const contextMessage =
      context?.files?.length
        ? `\n\nবর্তমান প্রজেক্ট ফাইলসমূহ:\n${context.files.map((f: string) => `- ${f}`).join("\n")}`
        : "";

    let userContent = message + contextMessage;

    if (mode === "revise") {
      userContent = `ইউজার এই প্ল্যানে পরিবর্তন চাইছে: ${message}${contextMessage}`;
    }

    let apiResponse: Response;
    let usedProvider = "";

    // ===== Novemixs =====
    if (NOVEMIXS_API_KEY) {
      usedProvider = "novemixs";

      apiResponse = await fetch(
        "https://api-shield--ahmjahangiralam.replit.app/api/ai/chat",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOVEMIXS_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `${PLANNER_PROMPT}\n\nইউজারের অনুরোধ: ${userContent}`,
            model: "gpt-4o",
          }),
        }
      );
    }

    // ===== Gemini fallback =====
    else if (GEMINI_API_KEY) {
      usedProvider = "gemini";

      apiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: PLANNER_PROMPT + "\n\nইউজারের অনুরোধ: " + userContent }],
              },
            ],
          }),
        }
      );
    } else {
      throw new Error("NOVEMIXS বা GEMINI কোন API key পাওয়া যায়নি");
    }

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`${usedProvider} API Error: ${apiResponse.status} - ${errorText}`);
    }

    const result = await apiResponse.json();

    let content = "";
    if (usedProvider === "novemixs") {
      content = result?.response;
    } else {
      content = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!content) {
      throw new Error("AI থেকে কোনো valid response পাওয়া যায়নি");
    }

    const planMatch = content.match(/<<<PLAN_START>>>([\s\S]*?)<<<PLAN_END>>>/);

    if (!planMatch) {
      return new Response(
        JSON.stringify({ error: "PLAN format পাওয়া যায়নি", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = JSON.parse(planMatch[1].trim());

    return new Response(
      JSON.stringify({ plan, provider: usedProvider }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
