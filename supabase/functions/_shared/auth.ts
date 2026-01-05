import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return { user: null, error: "No authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    return { user: null, error: error.message };
  }

  return { user, error: null };
}

export function requireAuth(
  handler: (req: Request, user: any) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const { user, error } = await getAuthUser(req);

    if (error || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(req, user);
  };
}
