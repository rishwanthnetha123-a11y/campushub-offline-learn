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
    const { videoId } = await req.json();
    if (!videoId) throw new Error("videoId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if quiz already exists
    const { data: existing } = await supabase
      .from("ai_quizzes")
      .select("*")
      .eq("video_id", videoId)
      .maybeSingle();

    if (existing && existing.questions?.length > 0) {
      return new Response(JSON.stringify({ quiz: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch video metadata
    const { data: video, error: videoErr } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .maybeSingle();

    if (videoErr || !video) throw new Error("Video not found");

    // Determine difficulty based on duration
    const durationSec = video.duration_seconds || 0;
    const difficulty = durationSec > 600 ? "hard" : durationSec > 300 ? "medium" : "easy";
    const questionCount = difficulty === "hard" ? 8 : difficulty === "medium" ? 6 : 4;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Generate exactly ${questionCount} quiz questions for an educational video.

Video Title: ${video.title}
Subject: ${video.subject}
Topic: ${video.topic || "General"}
Description: ${video.description || "No description"}
Instructor: ${video.instructor || "Unknown"}
Duration: ${video.duration || "Unknown"}
Difficulty: ${difficulty}

Requirements:
- Mix question types: MCQ (4 options), True/False, and Short Answer
- Each question must test understanding of the topic
- Provide clear explanations for each answer
- Questions should progress from basic to advanced

Return a JSON array where each item has:
{
  "id": "unique_id",
  "question": "question text",
  "type": "mcq" | "true_false" | "short_answer",
  "options": ["A", "B", "C", "D"] (for mcq, ["True", "False"] for true_false, [] for short_answer),
  "correctAnswer": 0 (index for mcq/true_false, or 0 for short_answer),
  "correctText": "correct answer text for short_answer type",
  "explanation": "why this is correct",
  "difficulty": "easy" | "medium" | "hard"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a quiz generator. Return ONLY valid JSON array, no markdown." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_quiz_questions",
            description: "Save generated quiz questions",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      question: { type: "string" },
                      type: { type: "string", enum: ["mcq", "true_false", "short_answer"] },
                      options: { type: "array", items: { type: "string" } },
                      correctAnswer: { type: "number" },
                      correctText: { type: "string" },
                      explanation: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    },
                    required: ["id", "question", "type", "options", "correctAnswer", "explanation", "difficulty"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_quiz_questions" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let questions: any[] = [];

    // Extract from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      questions = parsed.questions || [];
    }

    if (questions.length === 0) {
      throw new Error("No questions generated");
    }

    // Save to database
    const { data: quiz, error: saveErr } = await supabase
      .from("ai_quizzes")
      .upsert({
        video_id: videoId,
        questions,
        difficulty,
        question_count: questions.length,
        generated_from: "metadata",
      }, { onConflict: "video_id" })
      .select()
      .single();

    if (saveErr) {
      console.error("Save error:", saveErr);
      // Return questions even if save fails
      return new Response(JSON.stringify({ quiz: { questions, difficulty, question_count: questions.length } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ quiz }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-quiz error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
