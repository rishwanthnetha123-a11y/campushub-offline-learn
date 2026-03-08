import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBJECT_TOPICS: Record<string, string[]> = {
  Mathematics: [
    "What is the quadratic formula?",
    "How do you find the derivative of a function?",
    "What is the Pythagorean theorem?",
    "How to solve simultaneous equations?",
    "What are logarithms?",
    "How to calculate area and volume?",
    "What is integration?",
    "Explain matrices and determinants",
    "What is probability?",
    "How does trigonometry work?",
  ],
  Science: [
    "What is photosynthesis?",
    "How does the periodic table work?",
    "What is Newton's second law?",
    "What are acids and bases?",
    "How does DNA replication work?",
    "What is an ecosystem?",
    "Explain the water cycle",
    "What is kinetic energy?",
    "How do magnets work?",
    "What causes earthquakes?",
  ],
  "Computer Science": [
    "What is an algorithm?",
    "How does binary search work?",
    "What is object-oriented programming?",
    "Explain recursion with an example",
    "What is a database?",
    "How does the internet work?",
    "What is a linked list?",
    "What is time complexity?",
    "What are data types?",
    "How does sorting work?",
  ],
  "Standard ML": [
    "Explain pattern matching in SML",
    "What is a datatype in SML?",
    "How does foldr work in SML?",
    "What is currying in SML?",
    "How to use let...in...end in SML?",
    "What are SML type constructors?",
    "How does type inference work in SML?",
    "What is tail recursion in SML?",
    "How to use map and filter in SML?",
    "What are SML signatures and structures?",
  ],
  English: [
    "What are the parts of speech?",
    "How to write a thesis statement?",
    "What is a metaphor vs simile?",
    "How to structure an essay?",
    "What are tenses in English?",
  ],
  History: [
    "What caused World War I?",
    "What was the Industrial Revolution?",
    "Who was Mahatma Gandhi?",
    "What is the Renaissance?",
    "What was the French Revolution?",
  ],
  Geography: [
    "What are tectonic plates?",
    "How do rivers form?",
    "What is climate change?",
    "What are the types of rocks?",
    "How does urbanization affect the environment?",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, language = "en", count = 5 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const questions = SUBJECT_TOPICS[subject] || SUBJECT_TOPICS["Science"];
    const selectedQuestions = questions.slice(0, Math.min(count, questions.length));

    const languageInstruction = language !== "en"
      ? `Respond in the language with code "${language}".`
      : "Respond in English.";

    const prompt = `You are an educational tutor. Generate concise, clear answers for each question below. Each answer should be 2-4 sentences, suitable for a student. ${languageInstruction}

Questions:
${selectedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Return a JSON array of objects with "question" and "answer" fields. Only return the JSON array, no other text.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse the JSON from the AI response
    let faqs: { question: string; answer: string }[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        faqs = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse FAQ response:", e);
      faqs = [];
    }

    return new Response(
      JSON.stringify({ faqs, subject, language }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-faq error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
