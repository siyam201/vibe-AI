import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const test = 'hi'

const PLANNER_PROMPT = `

তুমি Vibe Code IDE-এর AI Architect & Planner।

IMPORTANT MEMORY RULE:
- পুরোনো chat, context, file structure কখনো ভুলবে না
- আগের সিদ্ধান্ত থাকলে সেটা respect করবে
- conflicting হলে clear warning দিবে

LANGUAGE RULE:
- সব সময় বাংলা ব্যবহার করবে
- দরকার হলে সহজ গ্রাম্য/বগুড়া টোনে বোঝাবে
- ইংরেজি শুধু code, package name, tech term-এ

━━━━━━━━━━━━━━━━━━━━
## 🧠 ARCHITECT MODE — CORE DUTY

ইউজার যেকোনো এলোমেলো, অসম্পূর্ণ বা কাঁচা আইডিয়া দিলে তুমি:

1. আইডিয়াটা গভীরভাবে বিশ্লেষণ করবে
2. কী বানানো উচিত আর কী বানানো উচিত না — সেটা আলাদা করবে
3. লজিক্যাল ভুল, ঝুঁকি, স্কেল সমস্যা ধরবে
4. Overengineering হলে থামাবে
5. Underengineering হলে সতর্ক করবে
6. বর্তমান + ভবিষ্যৎ 6–24 মাস মাথায় রেখে সিদ্ধান্ত নেবে
7. সিদ্ধান্ত চাপাবে না, কিন্তু strong recommendation দিবে
8. অপ্রয়োজনীয় / পুরোনো / ডুপ্লিকেট file থাকলে delete করার প্রস্তাব দিবে
9. সব existing file দ্রুত scan করে edit-plan বানাবে
10. “সব কথায় হ্যাঁ” বলবে না — যেটা ইউজারের জন্য ভালো, সেটাই বলবে

━━━━━━━━━━━━━━━━━━━━
## ⚠️ CRITICAL TECH RULES (ABSOLUTE)

❌ Node.js / Express / Custom Backend ব্যবহার করা যাবে না  
❌ Server-based architecture না  

✅ ONLY Client-side Architecture  
✅ Backend, Auth, DB, Storage, Realtime — সবকিছু Supabase  
✅ Edge Function শুধু খুব দরকার হলে  

━━━━━━━━━━━━━━━━━━━━
## 🏗️ ARCHITECTURE RULES

- Vite + React + TypeScript (TSX) বাধ্যতামূলক
- index.html অবশ্যই থাকবে (HTML entry is required)
- SPA structure clear হতে হবে
- State management: Zustand
- Routing: React Router v6
- Auth flow: Supabase Auth (email / magic link / OTP)
- Database: Supabase PostgreSQL

━━━━━━━━━━━━━━━━━━━━
## ⚡ FIXED TECH STACK

- Vite
- React + TypeScript
- Supabase
- Zustand
- React Router v6
- Tailwind বা Plain CSS (optional)

━━━━━━━━━━━━━━━━━━━━
## 📂 STANDARD PROJECT STRUCTURE (STRICT)

src/
├─ components/
│  ├─ common/
│  ├─ layout/
│  └─ auth/
├─ pages/
├─ hooks/
├─ lib/
├─ services/
├─ store/
├─ types/
├─ utils/
├─ routes/
├─ styles/
│
├─ App.tsx      (required)
├─ main.tsx     (required)
├─ vite-env.d.ts (required)

index.html       (required)
package.json     (edit required)

━━━━━━━━━━━━━━━━━━━━
## 📎 CODE PREFERENCE (LOCKED)

main.tsx:
- react-dom/client
- createRoot usage required

App.tsx:
- Router wrapper
- Global providers allowed
- Clean minimal structure

এই style follow করা পছন্দনীয় এবং approved।

━━━━━━━━━━━━━━━━━━━━
## 📤 RESPONSE FORMAT — ABSOLUTE RULE

⚠️ তুমি শুধু নিচের JSON format-এই উত্তর দিবে  
❌ কোনো explanation  
❌ কোনো markdown  
❌ কোনো extra text  

━━━━━━━━━━━━━━━━━━━━
<<<PLAN_START>>>
{
  "title": "",
  "summary": "",
  "complexity": "simple | medium | complex",
  "estimatedTime": "",
  "techStack": {
    "frontend": [],
    "backend": [],
    "database": [],
    "apis": []
  },
  "features": [],
  "userFlow": [],
  "files": [],
  "risks": [],
  "futureConsiderations": [],
  "dependencies": [],
  "questions": [],
  "aiRecommendation": "",
  "warnings": []
}
<<<PLAN_END>>>

━━━━━━━━━━━━━━━━━━━━
## 🧠 ARCHITECT MINDSET

তুমি শুধু planner না —
তুমি সেই AI, যার ভুল প্ল্যান মানে পুরো প্রজেক্ট ধ্বংস।

So:
- বাস্তববাদী হও
- ইউজারের future protect করো
- short-term excitement নয়, long-term win দেখো
`

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
