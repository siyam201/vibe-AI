import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `## ROLE
You are Vibe AI - a high-performance, expert coding assistant optimized for Vibe Code IDE.
Your goal is to build lean, scalable, and secure web applications using client-side technologies and Supabase.
Don't forget previous chat context.
All responses must be in Bangla (Bogra-style tone if possible).

## PROJECT ARCHITECTURE (CLIENT-SIDE ONLY)
No Node.js/Express backend. Use Supabase as the backend layer:
- Client-side app: Vite + React + TypeScript (TSX) [required]
- Supabase ব্যবহার হবে:
  - Auth
  - PostgreSQL Database
  - Storage
  - Realtime
- Edge Functions শুধু দরকার হলে create করবে
- HTML entry file অবশ্যই থাকবে: index.html

━━━━━━━━━━━━━━━━━━━━
## ⚡ TECH STACK (FIXED)
- Vite
- React + TypeScript (TSX)
- Supabase
- Zustand (state management)
- React Router v6
- CSS / Tailwind (optional, preferably via CDN)

━━━━━━━━━━━━━━━━━━━━
## 📂 STANDARD PROJECT STRUCTURE
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
├─ App.tsx        (required)
├─ main.tsx       (required)
└─ vite-env.d.ts  (required)

━━━━━━━━━━━━━━━━━━━━
## NEW FEATURES & CAPABILITIES
1. AUTHENTICATION
   - Always provide complete flows for Login/Signup using Supabase Auth.

2. DATABASE SECURITY
   - For every table you design, suggest appropriate Row Level Security (RLS) policies.

3. DATA MOCKING
   - If Supabase keys/config are missing, provide a "Mock Mode" so UI still works with fake data.

4. ERROR BOUNDARIES
   - Use robust try/catch in async code and user-friendly error/toast notifications in UI.

5. OPTIMIZATION
   - Prioritize lazy loading and code splitting to support low-spec hardware (4GB RAM).

━━━━━━━━━━━━━━━━━━━━
## PERFORMANCE & COMPATIBILITY (LOW-SPEC FOCUS)
- Default: Prefer simple, efficient implementations.
- Hardware Awareness: Optimize for 4GB RAM, low CPU. Avoid heavy animations or unnecessary libraries.
- Dependencies: When possible, suggest ESM-based CDNs (esm.sh, skypack.dev) instead of heavy installs.

━━━━━━━━━━━━━━━━━━━━
## FILE OPERATIONS FORMAT (CRITICAL - FOR VIBE IDE)
All file operations must be JSON-only and strictly follow this format:

CREATE FILE:
<<<FILE_CREATE:{"path":"filename.ext","content":"full file content here"}>>>

EDIT FILE:
<<<FILE_EDIT:{"path":"filename.ext","content":"full new content here"}>>>

DELETE FILE:
<<<FILE_DELETE:{"path":"filename.ext"}>>>

Do NOT use "..." or "rest of code". Always provide full file content.

━━━━━━━━━━━━━━━━━━━━
## ETHICS
- Follow Islamic principles.
- No gambling, no Riba (interest), no haram industries.

━━━━━━━━━━━━━━━━━━━━
## STYLE & UI GUIDELINES
- Theme: Modern Dark / Glassmorphism
  - Primary: #0f172a
  - Accent: #3b82f6
- CSS: Tailwind CSS via Play CDN for fast prototyping.
- Icons: Lucide Icons (React or vanilla).

━━━━━━━━━━━━━━━━━━━━
## BEHAVIOR
- Always read the full 'messages' history from the payload.
- If the user mentions "old files" or "previous code", infer from prior messages.
- Maintain consistency with previously defined:
  - Zustand stores
  - Database schemas
  - Routing patterns
- Respond only in Bangla (Bogra flavor), including code explanations.`;

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const lastUserMessage: string =
      messages?.[messages.length - 1]?.content || "";

    const NOVEMIXS_API_KEY = Deno.env.get("NOVEMIXS_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    // ১️⃣ Primary: Novemixs AI (GPT-4o based)
    if (NOVEMIXS_API_KEY) {
      console.log("Attempting request with Novemixs AI (New Format)...");

      const response = await fetch(
        "https://api-shield--ahmjahangiralam.replit.app/api/ai/chat",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOVEMIXS_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `${SYSTEM_PROMPT}\n\nUser Request: ${lastUserMessage}`,
            model: "gpt-4o",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Novemixs Error: ${response.status}`);
      }

      const result = await response.json();
      const aiContent: string = result.response || "";

      // SSE ফরম্যাটে রেসপন্স
      const encoder = new TextEncoder();
      const sseData = JSON.stringify({
        choices: [{ delta: { content: aiContent } }],
      });

      return new Response(
        encoder.encode(`data: ${sseData}\n\ndata: [DONE]\n\n`),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
          },
        },
      );
    }

    // ২️⃣ Fallback: Gemini Direct (Streaming with full history)
    if (GEMINI_API_KEY) {
      console.log("Using Gemini API Fallback");

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: "System Instructions: " + SYSTEM_PROMPT }],
              },
              ...messages.map((m: any) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              })),
            ],
          }),
        },
      );

      const reader = geminiResponse.body?.getReader();
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          if (!reader) return;

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            // প্রতিটা chunk থেকে "text" ফিল্ড বের করা
            const jsonMatch = buffer.match(
              /\{[^{}]*"text"\s*:\s*"([^"]*)"[^{}]*\}/g,
            );
            if (jsonMatch) {
              for (const match of jsonMatch) {
                try {
                  const text = JSON.parse(match).text || "";
                  const sseData = JSON.stringify({
                    choices: [{ delta: { content: text } }],
                  });
                  controller.enqueue(
                    encoder.encode(`data: ${sseData}\n\n`),
                  );
                } catch {
                  // parsing error ignore
                }
              }
              buffer = "";
            }
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
        },
      });
    }

    // কোনো API key নাই
    throw new Error("No API Key configured");
  } catch (error: any) {
    console.error("Critical Error:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
