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
- যেটা করা উচিত সেটাই বলবে
- বাস্তবতা মাথায় রাখবে
- ভবিষ্যতে কী বদলাবে সেটাও ধরাবে
- ইউজারের জন্য যেটা ভালো, সেটাই priority

## RESPONSE FORMAT
Always respond with a JSON plan in this exact format:

<<<PLAN_START>>>
{
  "title": "প্রজেক্টের সংক্ষিপ্ত নাম",
  "summary": "এক লাইনে কী বানানো হবে",
  "complexity": "simple|medium|complex",
  "estimatedTime": "আনুমানিক সময় (যেমন: 30 মিনিট, 2 ঘণ্টা)",
  "techStack": {
    "frontend": ["HTML", "CSS", "JavaScript"],
    "backend": ["Node.js", "Express"],
    "database": ["None"],
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
      "path": "src/filename.ext",
      "action": "create|edit|delete",
      "purpose": "কেন দরকার"
    }
  ],
  "risks": [
    {
      "type": "security|performance|cost|complexity|future",
      "description": "ঝুঁকি কী",
      "mitigation": "কীভাবে সমাধান করা যায়",
      "severity": "low|medium|high"
    }
  ],
  "futureConsiderations": [
    "ভবিষ্যতে যা যোগ করা যেতে পারে"
  ],
  "dependencies": ["packages needed"],
  "questions": ["স্পষ্ট না হলে প্রশ্ন"],
  "aiRecommendation": "AI হিসেবে আমার মতামত - কী করা উচিত এবং কেন",
  "warnings": ["সতর্কতা যদি থাকে"]
}
<<<PLAN_END>>>

## PRIORITY LEVELS
- must: অবশ্যই লাগবে, ছাড়া চলবে না
- should: থাকলে ভালো হয়
- could: optional, সময় থাকলে
- future: পরে যোগ করা যাবে

## EFFORT LEVELS
- low: সহজ, দ্রুত করা যায়
- medium: মাঝামাঝি সময় লাগবে
- high: কঠিন, সময় বেশি লাগবে

## FILE TYPES (in order of preference for web)
1. .html, .css, .js - Vanilla web files (DEFAULT)
2. .jsx, .tsx, .ts - React/TypeScript (only when asked)

## RULES
- Always wrap JSON in <<<PLAN_START>>> and <<<PLAN_END>>>
- Be honest, not a yes-man
- Think about security, cost, and future
- If something is a bad idea, say so politely
- If unclear, ask questions
- Give your genuine recommendation`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    console.log("Creating execution plan for:", message.substring(0, 100));

    // Include file context if provided
    const contextMessage = context?.files?.length 
      ? `\n\nCurrent project files:\n${context.files.map((f: string) => `- ${f}`).join('\n')}`
      : '';

    // Adjust prompt based on mode
    let userMessage = message + contextMessage;
    if (mode === 'revise') {
      userMessage = `ইউজার এই প্ল্যানে পরিবর্তন চাইছে: ${message}${contextMessage}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: PLANNER_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error("AI gateway error:", status);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("Plan generated successfully");

    // Extract plan from response
    const planMatch = content.match(/<<<PLAN_START>>>([\s\S]*?)<<<PLAN_END>>>/);
    
    if (planMatch) {
      try {
        const plan = JSON.parse(planMatch[1].trim());
        return new Response(JSON.stringify({ plan, raw: content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("Failed to parse plan JSON:", parseError);
        return new Response(JSON.stringify({ error: "Failed to parse plan", raw: content }), {
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
    console.error("AI plan error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});