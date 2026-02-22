import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { phone, action } = await req.json();

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio credentials are not configured");
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    if (action === "send") {
      // Generate a 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      // Store OTP in a simple KV via Supabase (using service role)
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Store OTP temporarily (we'll use a simple table or just verify in-memory via Twilio Verify)
      // Using Twilio Verify Service instead for production-ready OTP
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const body = new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: `Your CampusHub verification code is: ${otp}. Valid for 10 minutes.`,
      });

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!twilioResponse.ok) {
        const errData = await twilioResponse.text();
        console.error("Twilio error:", errData);
        throw new Error("Failed to send SMS");
      }

      // Store OTP hash in database for verification
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Use a simple approach: store in a temporary table or use RPC
      // For now, store as a hashed value we can verify
      const otpHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(otp + formattedPhone)
      );
      const hashHex = Array.from(new Uint8Array(otpHash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Store in phone_otps table
      await supabaseAdmin.from("phone_otps").upsert(
        {
          phone: formattedPhone,
          otp_hash: hashHex,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
        { onConflict: "phone" }
      );

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      const { otp } = await req.json();
      // This is handled in the verify-otp function
      return new Response(
        JSON.stringify({ error: "Use verify-otp endpoint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
