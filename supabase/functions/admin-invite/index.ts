import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, email, inviteToken } = await req.json();

    if (action === "create") {
      // Create invite
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if invite already exists
      const { data: existingInvite } = await supabaseAdmin
        .from("admin_invites")
        .select("id")
        .eq("email", email)
        .eq("accepted", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (existingInvite) {
        return new Response(
          JSON.stringify({ error: "Active invite already exists for this email" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new invite
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from("admin_invites")
        .insert({
          email,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) {
        throw inviteError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          invite: {
            id: invite.id,
            email: invite.email,
            invite_token: invite.invite_token,
            expires_at: invite.expires_at,
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "accept") {
      // Accept invite - this makes the current user an admin
      if (!inviteToken) {
        return new Response(
          JSON.stringify({ error: "Invite token is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: invite, error: findError } = await supabaseAdmin
        .from("admin_invites")
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

      // Check if invite email matches user email
      if (invite.email !== user.email) {
        return new Response(
          JSON.stringify({ error: "Invite is for a different email address" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Grant admin role
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: "admin",
        });

      if (roleInsertError) {
        throw roleInsertError;
      }

      // Mark invite as accepted
      await supabaseAdmin
        .from("admin_invites")
        .update({ accepted: true })
        .eq("id", invite.id);

      return new Response(
        JSON.stringify({ success: true, message: "You are now an admin!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("admin-invite error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
