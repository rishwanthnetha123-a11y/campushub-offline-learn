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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from auth
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Authentication failed");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user's progress, quiz scores, and available videos
    const [progressRes, quizRes, videosRes] = await Promise.all([
      supabase.from("student_progress").select("*").eq("user_id", user.id),
      supabase.from("quiz_attempts").select("*").eq("user_id", user.id),
      supabase.from("videos").select("*").eq("is_active", true).order("display_order"),
    ]);

    const progress = progressRes.data || [];
    const quizAttempts = quizRes.data || [];
    const videos = videosRes.data || [];

    // Calculate weak subjects
    const subjectScores: Record<string, { total: number; count: number }> = {};
    for (const q of quizAttempts) {
      // Find video for this quiz
      const video = videos.find((v: any) => q.quiz_id.includes(v.id));
      const subject = video?.subject || "Unknown";
      if (!subjectScores[subject]) subjectScores[subject] = { total: 0, count: 0 };
      subjectScores[subject].total += (q.score || 0);
      subjectScores[subject].count += 1;
    }

    const completedVideoIds = progress.filter((p: any) => p.completed && p.content_type === "video").map((p: any) => p.content_id);
    const pendingVideos = videos.filter((v: any) => !completedVideoIds.includes(v.id));
    const inProgressVideos = progress.filter((p: any) => !p.completed && p.progress > 0 && p.content_type === "video");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Generate a 7-day study plan for a student.

Student Data:
- Completed videos: ${completedVideoIds.length} of ${videos.length}
- In-progress videos: ${inProgressVideos.length}
- Pending videos: ${pendingVideos.length}
- Quiz attempts: ${quizAttempts.length}

Subject Performance:
${Object.entries(subjectScores).map(([s, d]) => `- ${s}: avg ${Math.round(d.total / d.count)}%`).join("\n") || "No quiz data yet"}

Pending Videos:
${pendingVideos.slice(0, 10).map((v: any) => `- ${v.title} (${v.subject}, ${v.duration || "unknown"})`).join("\n") || "All caught up!"}

In-Progress Videos:
${inProgressVideos.slice(0, 5).map((p: any) => {
  const v = videos.find((vid: any) => vid.id === p.content_id);
  return `- ${v?.title || p.content_id} (${p.progress}% done)`;
}).join("\n") || "None"}

Rules:
- Prioritize weak subjects and in-progress content
- Each day should have 2-3 tasks max (realistic for students)
- Include quiz review for failed subjects
- Include rest day on Sunday
- Tasks: "watch_video", "take_quiz", "review_notes", "practice"`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a study planner AI. Return structured study plans." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_study_plan",
            description: "Save a weekly study plan",
            parameters: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      date_offset: { type: "number", description: "Days from today (0=today)" },
                      tasks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            type: { type: "string", enum: ["watch_video", "take_quiz", "review_notes", "practice", "rest"] },
                            title: { type: "string" },
                            subject: { type: "string" },
                            duration_minutes: { type: "number" },
                            video_id: { type: "string" },
                            priority: { type: "string", enum: ["high", "medium", "low"] },
                          },
                          required: ["type", "title", "subject", "duration_minutes", "priority"],
                        },
                      },
                    },
                    required: ["day", "date_offset", "tasks"],
                  },
                },
                focus_subjects: { type: "array", items: { type: "string" } },
                weekly_goal: { type: "string" },
              },
              required: ["days", "focus_subjects", "weekly_goal"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_study_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI generation failed`);
    }

    const aiData = await aiResponse.json();
    let planData: any = {};

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      planData = JSON.parse(toolCall.function.arguments);
    }

    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Save to DB
    const { data: savedPlan, error: saveErr } = await supabase
      .from("study_plans")
      .upsert({
        user_id: user.id,
        plan_data: planData,
        week_start: weekStartStr,
      }, { onConflict: "user_id,week_start" })
      .select()
      .single();

    if (saveErr) console.error("Save plan error:", saveErr);

    return new Response(JSON.stringify({ plan: savedPlan || { plan_data: planData, week_start: weekStartStr } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("study-plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
