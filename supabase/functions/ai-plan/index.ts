import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANNER_PROMPT = `তুমি Vibe Code IDE-এর AI Architect। তোমার কাজ হলো ইউজারের এলোমেলো, অসম্পূর্ণ আইডিয়া নিয়ে চিন্তা করা এবং একটা ভালো প্ল্যান বানানো।

## তোমার ভূমিকা (Architect Mode)
যখন ইউজার কিছু বানাতে চায়, তুমি:
1. আইডিয়াটা গভীরভাবে বিশ্লেষণ করবে
2. ভুল বা ঝুঁকি থাকলে ধরবে ও জানাবে
3. বর্তমান + ভবিষ্যৎ দুনিয়া মাথায় রেখে প্ল্যান বানাবে
4. overengineering হলে সতর্ক করবে
5. underengineering হলে জানাবে
6. সিদ্ধান্ত নেবে না - শুধু suggest করবে

## তোমার নীতিমালা
- সব কথায় হ্যাঁ বলবে না
- যেটা করা উচিত সেটাই বলবে (বগুড়ার ভাষায় সহজ করে বুঝিয়ে বলবে যদি দরকার হয়)
- বাস্তবতা মাথায় রাখবে
- ভবিষ্যতে কী বদলাবে সেটাও ধরাবে
- ইউজারের জন্য যেটা ভালো, সেটাই priority
- **CRITICAL: No Node.js. Always use Supabase for any backend/database needs.**

## RESPONSE FORMAT
Always respond with a JSON plan in this exact format:

<<<PLAN_START>>>
{
  "title": "প্রজেক্টের সংক্ষিপ্ত নাম",
  "summary": "এক লাইনে কী বানানো হবে",
  "complexity": "simple|medium|complex",
  "estimatedTime": "আনুমানিক সময়",
  "techStack": {
    "frontend": ["HTML", "CSS", "JavaScript/Vite"],
    "backend": ["Supabase Edge Functions"],
    "database": ["Supabase/PostgreSQL"],
    "apis": ["Gemini API"]
  },
  "features": [
    {
      "id": 1,
      "name": "Feature নাম",
      "description": "কী করবে",
      "priority": "must|should|could|future",
      "effort": "low|medium|high",
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
      "action": "create|edit|delete",
      "purpose": "কেন দরকার"
    }
  ],
  "risks": [
    {
      "type": "security|performance|cost",
      "description": "ঝুঁকি কী",
      "mitigation": "সমাধান কী",
      "severity": "low|medium|high"
    }
  ],
  "futureConsiderations": ["ভবিষ্যতে যা যোগ করা যেতে পারে"],
  "dependencies": ["packages needed"],
  "questions": ["স্পষ্ট না হলে প্রশ্ন"],
  "aiRecommendation": "AI হিসেবে আমার মতামত",
  "warnings": ["সতর্কতা"]
}
<<<PLAN_END>>>`;

serve(async (req) => {
  // CORS প্রি-ফ্লাইট রিকোয়েস্ট হ্যান্ডলিং
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
      throw new Error("No AI API key configured");
    }

    console.log("Generating execution plan...");

    // আগের ফাইলগুলোর কনটেক্সট যোগ করা
    const contextMessage = context?.files?.length 
      ? `\n\nCurrent project files:\n${context.files.map((f: string) => `- ${f}`).join('\n')}`
      : '';

    let userContent = message + contextMessage;
    if (mode === 'revise') {
      userContent = `ইউজার এই প্ল্যানে পরিবর্তন চাইছে: ${message}${contextMessage}`;
    }

    let response: Response;
    
    // Lovable AI ব্যবহার করার চেষ্টা
    if (LOVABLE_API_KEY) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash", // দ্রুত রেসপন্সের জন্য
          messages: [
            { role: "system", content: PLANNER_PROMPT },
            { role: "user", content: userContent },
          ],
        }),
      });
    } else {
      // Gemini API সরাসরি ব্যবহার (Fallback)
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: PLANNER_PROMPT + "\n\nUser Request: " + userContent }] }
          ]
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`AI Gateway Error: ${response.status}`);
    }

    const result = await response.json();
    // Lovable বা Gemini এর ফরম্যাট অনুযায়ী কন্টেন্ট বের করা
    const content = LOVABLE_API_KEY 
      ? result.choices?.[0]?.message?.content 
      : result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error("No content received from AI");

    // JSON প্ল্যানটি এক্সট্রাক্ট করা
    const planMatch = content.match(/<<<PLAN_START>>>([\s\S]*?)<<<PLAN_END>>>/);
    
    if (planMatch) {
      try {
        const plan = JSON.parse(planMatch[1].trim());
        return new Response(JSON.stringify({ plan, raw: content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("JSON Parsing failed:", parseError);
        return new Response(JSON.stringify({ error: "Invalid JSON format in plan", raw: content }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "No plan found in response", raw: content }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Planner Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
