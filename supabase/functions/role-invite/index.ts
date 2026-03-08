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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");

    const body = await req.json();
    const { action } = body;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // === ACCEPT INVITE (no auth required - user may not be logged in yet) ===
    if (action === "accept") {
      const { inviteToken, userId, userEmail } = body;
      if (!inviteToken || !userId || !userEmail) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find valid invite
      const { data: invite, error: findError } = await supabaseAdmin
        .from("role_invites")
        .select("*")
        .eq("invite_token", inviteToken)
        .eq("accepted", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (findError || !invite) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired invite" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify email match
      if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: "This invite is for a different email address" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: invite.role }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("Role assignment error:", roleError);
        throw roleError;
      }

      // Update profile with department if provided
      if (invite.department_id) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ department_id: invite.department_id })
          .eq("id", userId);
        
        if (profileError) {
          console.error("Profile department update error:", profileError);
          // Don't throw - role was already assigned, but log the issue
        } else {
          console.log(`Updated profile ${userId} with department ${invite.department_id}`);
        }
      }

      // Mark invite as accepted
      await supabaseAdmin
        .from("role_invites")
        .update({ accepted: true })
        .eq("id", invite.id);

      return new Response(
        JSON.stringify({ success: true, role: invite.role, message: `You are now a ${invite.role}!` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === ADMIN-ONLY ACTIONS (create invite) ===
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create") {
      const { email, role, departmentId } = body;
      if (!email || !role) {
        return new Response(
          JSON.stringify({ error: "Email and role are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!["hod", "faculty"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Invalid role. Must be hod or faculty" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check duplicate active invite
      const { data: existing } = await supabaseAdmin
        .from("role_invites")
        .select("id")
        .eq("email", email)
        .eq("accepted", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Active invite already exists for this email" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: invite, error: inviteError } = await supabaseAdmin
        .from("role_invites")
        .insert({
          email,
          role,
          department_id: departmentId || null,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      return new Response(
        JSON.stringify({
          success: true,
          invite: {
            id: invite.id,
            email: invite.email,
            role: invite.role,
            invite_token: invite.invite_token,
            expires_at: invite.expires_at,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("role_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ invites: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("role-invite error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
