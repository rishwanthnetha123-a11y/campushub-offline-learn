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

    // Verify admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    // Fetch all data in parallel
    const [progressRes, quizRes, videosRes, profilesRes, watchRes] = await Promise.all([
      supabase.from("student_progress").select("*"),
      supabase.from("quiz_attempts").select("*"),
      supabase.from("videos").select("id, title, subject, topic"),
      supabase.from("profiles").select("id, full_name, email, created_at"),
      supabase.from("watch_analytics").select("*"),
    ]);

    const progress = progressRes.data || [];
    const quizzes = quizRes.data || [];
    const videos = videosRes.data || [];
    const profiles = profilesRes.data || [];
    const watchData = watchRes.data || [];

    // 1. Most difficult topics (lowest avg quiz scores)
    const topicScores: Record<string, { total: number; count: number; subject: string }> = {};
    for (const q of quizzes) {
      // Match quiz to video
      for (const v of videos) {
        if (q.quiz_id.includes(v.id)) {
          const key = v.topic || v.subject;
          if (!topicScores[key]) topicScores[key] = { total: 0, count: 0, subject: v.subject };
          topicScores[key].total += (q.score || 0);
          topicScores[key].count += 1;
        }
      }
    }

    const difficultTopics = Object.entries(topicScores)
      .map(([topic, data]) => ({
        topic,
        subject: data.subject,
        avgScore: Math.round(data.total / data.count),
        attempts: data.count,
      }))
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 10);

    // 2. Subject-wise performance
    const subjectPerf: Record<string, { scores: number[]; completed: number; total: number }> = {};
    for (const v of videos) {
      if (!subjectPerf[v.subject]) subjectPerf[v.subject] = { scores: [], completed: 0, total: 0 };
      subjectPerf[v.subject].total += 1;
    }
    for (const p of progress) {
      const v = videos.find((vid: any) => vid.id === p.content_id);
      if (v && p.completed) subjectPerf[v.subject].completed += 1;
    }
    for (const q of quizzes) {
      for (const v of videos) {
        if (q.quiz_id.includes(v.id)) {
          subjectPerf[v.subject]?.scores.push(q.score || 0);
        }
      }
    }

    const subjectAnalytics = Object.entries(subjectPerf).map(([subject, data]) => ({
      subject,
      avgScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      totalVideos: data.total,
      quizAttempts: data.scores.length,
    }));

    // 3. Inactive students (no activity in 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeUserIds = new Set([
      ...progress.filter((p: any) => p.updated_at > sevenDaysAgo).map((p: any) => p.user_id),
      ...quizzes.filter((q: any) => q.completed_at > sevenDaysAgo).map((q: any) => q.user_id),
    ]);
    const inactiveStudents = profiles
      .filter((p: any) => !activeUserIds.has(p.id))
      .map((p: any) => ({ id: p.id, name: p.full_name || "Unknown", email: p.email, joinedAt: p.created_at }));

    // 4. Completion trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyCompletions: Record<string, number> = {};
    for (const p of progress) {
      if (p.completed && p.completed_at) {
        const date = p.completed_at.split("T")[0];
        if (new Date(date) >= thirtyDaysAgo) {
          dailyCompletions[date] = (dailyCompletions[date] || 0) + 1;
        }
      }
    }

    const completionTrend = Object.entries(dailyCompletions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, completions: count }));

    // 5. Drop-off analysis from watch analytics
    const dropOffAnalysis = watchData
      .filter((w: any) => w.drop_off_point !== null)
      .reduce((acc: Record<string, { total: number; count: number }>, w: any) => {
        const v = videos.find((vid: any) => vid.id === w.video_id);
        const title = v?.title || w.video_id;
        if (!acc[title]) acc[title] = { total: 0, count: 0 };
        acc[title].total += w.drop_off_point;
        acc[title].count += 1;
        return acc;
      }, {});

    const dropOffs = Object.entries(dropOffAnalysis)
      .map(([title, data]: [string, any]) => ({
        video: title,
        avgDropOffSeconds: Math.round(data.total / data.count),
        studentCount: data.count,
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 10);

    return new Response(JSON.stringify({
      difficultTopics,
      subjectAnalytics,
      inactiveStudents,
      completionTrend,
      dropOffs,
      summary: {
        totalStudents: profiles.length,
        activeStudents: activeUserIds.size,
        totalQuizAttempts: quizzes.length,
        avgQuizScore: quizzes.length > 0 ? Math.round(quizzes.reduce((s: number, q: any) => s + (q.score || 0), 0) / quizzes.length) : 0,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-analytics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
