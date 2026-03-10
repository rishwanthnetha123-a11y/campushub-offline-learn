import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { users, departmentId, role } = await req.json();

    const results: any[] = [];

    for (const u of users) {
      try {
        // Create auth user
        const { data: authData, error: authErr } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.email.split('@')[0] },
        });

        if (authErr) {
          results.push({ email: u.email, success: false, error: authErr.message });
          continue;
        }

        const userId = authData.user.id;

        // Assign role
        await admin.from("user_roles").upsert(
          { user_id: userId, role },
          { onConflict: "user_id,role" }
        );

        // Update profile with department
        await admin.from("profiles").update({ department_id: departmentId }).eq("id", userId);

        results.push({ email: u.email, success: true, userId });
      } catch (e: any) {
        results.push({ email: u.email, success: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
