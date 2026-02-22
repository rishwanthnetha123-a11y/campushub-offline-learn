import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    // Hash the OTP + phone to compare
    const otpHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(otp + formattedPhone)
    );
    const hashHex = Array.from(new Uint8Array(otpHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check OTP
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("phone_otps")
      .select("*")
      .eq("phone", formattedPhone)
      .eq("otp_hash", hashHex)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - delete it
    await supabaseAdmin.from("phone_otps").delete().eq("phone", formattedPhone);

    // Check if user exists with this phone, or create one
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.phone === formattedPhone
    );

    if (existingUser) {
      // Generate a session for existing user
      const { data: sessionData, error: signInError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: existingUser.email || `${formattedPhone.replace("+", "")}@phone.campushub.local`,
        });

      if (signInError) throw signInError;

      // Sign in the user directly
      const { data: signInData, error: tokenError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: existingUser.email || `${formattedPhone.replace("+", "")}@phone.campushub.local`,
        });

      return new Response(
        JSON.stringify({
          success: true,
          user_id: existingUser.id,
          email: existingUser.email,
          is_new: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create new user with phone
      const dummyEmail = `${formattedPhone.replace("+", "")}@phone.campushub.local`;
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: dummyEmail,
          phone: formattedPhone,
          password: tempPassword,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { full_name: `Student ${formattedPhone.slice(-4)}`, phone_user: true },
        });

      if (createError) throw createError;

      return new Response(
        JSON.stringify({
          success: true,
          user_id: newUser.user.id,
          email: dummyEmail,
          temp_password: tempPassword,
          is_new: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
