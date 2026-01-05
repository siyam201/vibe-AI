import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Vibe AI - an expert coding assistant for Vibe Code IDE with live preview.

## PROJECT ARCHITECTURE (NO NODE.JS)
This IDE uses Supabase directly for backend logic. The project structure should be:
├─ src/                      # Source files
│  ├─ main.ts/main.jsx       # Entry point
│  ├─ App.tsx/App.jsx        # Main component
│  ├─ supabase.ts            # Supabase client configuration
│  ├─ components/            # UI Components
│  └─ styles/                # CSS/Tailwind files
├─ index.html                # Entry HTML
├─ vite.config.ts            # Vite configuration
└─ package.json

## IMPORTANT: DEFAULT TO VANILLA WEB FILES
If the user doesn't specify "React", always default to index.html, styles.css, and main.js for maximum performance on all devices.

## FILE OPERATIONS - CRITICAL FORMAT
CREATE FILE:
<<<FILE_CREATE:{"path":"filename.ext","content":"full file content here"}>>>

EDIT FILE:
<<<FILE_EDIT:{"path":"filename.ext","content":"full new content here"}>>>

DELETE FILE:
<<<FILE_DELETE:{"path":"filename.ext"}>>>

## CRITICAL RULES
1. path: use "index.html" for root, "src/main.ts" for source folder.
2. content: COMPLETE file content. Escape newlines as \\n and quotes as \\".
3. ALWAYS close with >>>.
4. For Database: Use Supabase client library. Do not suggest creating a separate Node.js server.

## STYLE GUIDELINES
- Modern, clean UI (Dark theme preferred).
- Responsive design (Mobile-first).
- Use Tailwind CSS or modern CSS Variables.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    let response: Response;
    
    if (LOVABLE_API_KEY) {
      console.log("Using Lovable AI (Primary)");
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash", // Updated to 2.0 Flash for speed
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      });
    } else if (GEMINI_API_KEY) {
      console.log("Using Gemini API (Fallback)");
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            ...messages.map((m: any) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }))
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        }),
      });

      // Transform Gemini stream to SSE
      const reader = response.body?.getReader();
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
            const jsonMatch = buffer.match(/\{[^{}]*"text"\s*:\s*"([^"]*)"[^{}]*\}/g);
            if (jsonMatch) {
              for (const match of jsonMatch) {
                try {
                  const text = JSON.parse(match).text || "";
                  const sseData = JSON.stringify({ choices: [{ delta: { content: text } }] });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                } catch {}
              }
              buffer = "";
            }
          }
        }
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    } else {
      throw new Error("API Key not configured");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
