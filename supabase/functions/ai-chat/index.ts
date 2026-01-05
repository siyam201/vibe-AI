import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Vibe AI - an expert coding assistant for Vibe Code IDE with live preview.

## IMPORTANT: DEFAULT TO VANILLA WEB FILES
By default, ALWAYS create vanilla HTML, CSS, and JavaScript files unless the user specifically requests React, TypeScript, or Node.js.
- For web pages: Use index.html, styles.css, main.js
- For React/TypeScript: Only use .tsx, .jsx, .ts when explicitly requested
- The live preview works best with vanilla HTML/CSS/JS

## FILE OPERATIONS - CRITICAL FORMAT
Use these EXACT commands to manage files. The closing >>> is MANDATORY:

CREATE FILE:
<<<FILE_CREATE:{"path":"filename.ext","content":"full file content here"}>>>

EDIT FILE:
<<<FILE_EDIT:{"path":"filename.ext","content":"full new content here"}>>>

DELETE FILE:
<<<FILE_DELETE:{"path":"filename.ext"}>>>

## CRITICAL RULES
1. ALWAYS include the closing >>> immediately after the JSON closing brace }
2. path: use "filename.ext" for root files, "src/filename.ext" for src folder
3. content: must be the COMPLETE file content with escaped newlines as \\n
4. Always escape quotes inside content as \\"
5. Multiple operations allowed - include ALL needed files in one response
6. Explain briefly what you're creating, then output the file operations
7. html file create recqed
8. follow the (your-project name)/
├─ backend/                  # Node.js backend
│  ├─ server.js              # Express/Node server
│  ├─ routes/
│  │   └─ aiTask.js          # AI task execution routes
│  ├─ controllers/
│  │   └─ aiController.js    # AI logic + smart execution
│  ├─ utils/
│  │   └─ fileReader.js      # ফাইল read/write helper
│  └─ package.json
│
├─ frontend/                 # Vite + React frontend
│  ├─ index.html
│  ├─ src/
│  │   ├─ main.jsx
│  │   ├─ App.jsx
│  │   ├─ components/
│  │   │   └─ TaskExecutor.jsx
│  │   └─ services/
│  │       └─ api.js         # backend API calls
│  └─ package.json
│
└─ README.md


## FILE TYPES (in order of preference)
1. .html, .css, .js - Vanilla web files (DEFAULT - use these first!)
2. .jsx, .tsx, .ts - React/TypeScript (only when user asks for React)
3. .json, .md - Data/documentation

## LIVE PREVIEW BEST PRACTICES
Files are rendered in real-time in the preview panel. For best results:
- HTML files should be complete with DOCTYPE  
- CSS should use modern features (flexbox, grid, variables)
- JS should use modern ES6+ syntax
- Always link CSS and JS properly in HTML
- Use console.log() for debugging - logs appear in the console panel

## EXAMPLE OUTPUT (Default: Vanilla HTML/CSS/JS)
I'll create a modern landing page for you.

<<<FILE_CREATE:{"path":"index.html","content":"<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head>\\n  <meta charset=\\"UTF-8\\">\\n  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">\\n  <title>My App</title>\\n  <link rel=\\"stylesheet\\" href=\\"styles.css\\">\\n</head>\\n<body>\\n  <header>\\n    <h1>Welcome</h1>\\n    <nav><a href=\\"#\\">Home</a></nav>\\n  </header>\\n  <main>\\n    <section class=\\"hero\\">\\n      <h2>Build Amazing Apps</h2>\\n      <button id=\\"cta\\">Get Started</button>\\n    </section>\\n  </main>\\n  <script src=\\"main.js\\"></script>\\n</body>\\n</html>"}>>>

<<<FILE_CREATE:{"path":"styles.css","content":"* { margin: 0; padding: 0; box-sizing: border-box; }\\n\\n:root {\\n  --primary: #6366f1;\\n  --bg: #0f172a;\\n  --text: #f1f5f9;\\n}\\n\\nbody {\\n  font-family: 'Inter', system-ui, sans-serif;\\n  background: var(--bg);\\n  color: var(--text);\\n  min-height: 100vh;\\n}\\n\\nheader {\\n  display: flex;\\n  justify-content: space-between;\\n  align-items: center;\\n  padding: 1rem 2rem;\\n  border-bottom: 1px solid rgba(255,255,255,0.1);\\n}\\n\\n.hero {\\n  display: flex;\\n  flex-direction: column;\\n  align-items: center;\\n  justify-content: center;\\n  min-height: 80vh;\\n  gap: 2rem;\\n}\\n\\nbutton {\\n  background: var(--primary);\\n  color: white;\\n  border: none;\\n  padding: 1rem 2rem;\\n  border-radius: 0.5rem;\\n  font-size: 1rem;\\n  cursor: pointer;\\n  transition: transform 0.2s, box-shadow 0.2s;\\n}\\n\\nbutton:hover {\\n  transform: translateY(-2px);\\n  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);\\n}"}>>>

<<<FILE_CREATE:{"path":"main.js","content":"// App initialization\\nconsole.log('App loaded!');\\n\\n// CTA button handler\\nconst ctaBtn = document.getElementById('cta');\\nif (ctaBtn) {\\n  ctaBtn.addEventListener('click', () => {\\n    console.log('CTA clicked!');\\n    ctaBtn.textContent = 'Loading...';\\n    setTimeout(() => {\\n      ctaBtn.textContent = 'Welcome!';\\n    }, 1000);\\n  });\\n}"}>>>

Done! The landing page is ready in the live preview.

## WHEN TO USE REACT/TYPESCRIPT
Only create .tsx/.jsx/.ts files when the user explicitly asks for:
- "React app" or "React component"
- "TypeScript" or ".tsx file"
- "Node.js" or "npm project"

## TESTING & DEBUGGING
- Add console.log() statements to help debug
- Use descriptive log messages: console.log('[Component] Action:', data)
- Handle errors gracefully with try/catch
- Test interactive elements by adding click handlers

## STYLE GUIDELINES
- Generate clean, modern code with dark theme aesthetics
- Use responsive design with mobile-first approach
- Include smooth animations and transitions
- Use CSS custom properties for theming
- Write accessible HTML with proper semantic elements`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // Use Lovable AI first (always available), fallback to user's Gemini API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    let response: Response;
    
    if (LOVABLE_API_KEY) {
      // Use Lovable AI (primary - no quota issues)
      console.log("Using Lovable AI");
      
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      });
      
      if (!response.ok) {
        const status = response.status;
        console.error("Lovable AI error:", status);
        
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`Lovable AI error: ${status}`);
      }
      
      console.log("AI response started streaming");
      
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
      
    } else if (GEMINI_API_KEY) {
      // Fallback to user's Gemini API key
      console.log("Using user's Gemini API key (fallback)");
      
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            ...messages.map((m: any) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }))
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      // Transform Gemini streaming response to OpenAI-compatible SSE format
      const reader = response.body?.getReader();
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          if (!reader) {
            controller.close();
            return;
          }
          
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
            
            // Parse Gemini's JSON array response
            try {
              const jsonMatch = buffer.match(/\{[^{}]*"text"\s*:\s*"([^"]*)"[^{}]*\}/g);
              if (jsonMatch) {
                for (const match of jsonMatch) {
                  try {
                    const parsed = JSON.parse(match);
                    const text = parsed.text || "";
                    if (text) {
                      const sseData = JSON.stringify({
                        choices: [{ delta: { content: text } }]
                      });
                      controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                    }
                  } catch {}
                }
                buffer = "";
              }
            } catch {}
          }
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
      
    } else {
      throw new Error("No AI API key configured");
    }

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI response started streaming");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
