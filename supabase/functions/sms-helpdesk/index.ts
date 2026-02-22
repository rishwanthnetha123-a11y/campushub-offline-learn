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
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio credentials are not configured");
    }
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contentType = req.headers.get("content-type") || "";

    let question: string;
    let studentPhone: string;
    let studentId: string | undefined;
    let subject: string | undefined;
    let language: string = "en";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio webhook format
      const formData = await req.formData();
      const body = formData.get("Body")?.toString() || "";
      studentPhone = formData.get("From")?.toString() || "";

      // Parse SMS format: "Q: <question> | S: <subject> | ID: <studentId>"
      const parts = body.split("|").map((p) => p.trim());
      question = parts[0]?.replace(/^Q:\s*/i, "") || body;
      subject = parts.find((p) => /^S:/i.test(p))?.replace(/^S:\s*/i, "");
      studentId = parts.find((p) => /^ID:/i.test(p))?.replace(/^ID:\s*/i, "");
    } else {
      // JSON format (from the app)
      const json = await req.json();
      question = json.question;
      studentPhone = json.phone;
      studentId = json.studentId;
      subject = json.subject;
      language = json.language || "en";
    }

    if (!question) {
      return new Response(
        JSON.stringify({ error: "No question provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI response (concise, SMS-friendly)
    const systemPrompt = `You are CampusHub SMS Help Desk. A student sent a question via SMS (they may have very limited/no internet).
Rules:
- Keep answers UNDER 300 characters (SMS limit)
- Be clear and direct
- Use simple language
- If the question relates to ${subject || "any subject"}, focus on that
- No markdown, no formatting - plain text only
- If you can't answer properly in 300 chars, give the key concept + tell them to check the app when online`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          max_tokens: 150,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      throw new Error("AI service unavailable");
    }

    const aiData = await aiResponse.json();
    const answer =
      aiData.choices?.[0]?.message?.content?.slice(0, 300) ||
      "Sorry, I couldn't process your question. Please try again on the app.";

    // Send reply SMS via Twilio
    if (studentPhone) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      const smsBody = new URLSearchParams({
        To: studentPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: `CampusHub: ${answer}`,
      });

      const smsResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: smsBody.toString(),
      });

      if (!smsResponse.ok) {
        const smsErr = await smsResponse.text();
        console.error("Twilio SMS reply error:", smsErr);
      }
    }

    // Log the Q&A for analytics
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin.from("sms_helpdesk_logs").insert({
      phone: studentPhone,
      student_id: studentId || null,
      question,
      answer,
      subject: subject || null,
      language,
    });

    // Return TwiML for webhook or JSON for app
    if (contentType.includes("application/x-www-form-urlencoded")) {
      // TwiML response (Twilio will handle sending)
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${answer}</Message></Response>`,
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sms-helpdesk error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
