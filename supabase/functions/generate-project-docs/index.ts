import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectTitle, projectDescription, techStack, docType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompts: Record<string, string> = {
      abstract: `Generate a complete academic project abstract for the following project. Include: Title, Abstract (250-300 words), Introduction, Objectives, Methodology, Expected Results, and Conclusion sections.

Project Title: ${projectTitle}
Description: ${projectDescription}
Tech Stack: ${techStack || 'Not specified'}

Format the output in clean markdown with proper headings.`,

      ppt: `Create a detailed PowerPoint presentation outline for the following academic project. Include slide-by-slide content with:
- Title Slide
- Problem Statement
- Literature Review / Background
- Objectives
- System Architecture
- Methodology / Approach
- Technology Stack
- Implementation Details (3-4 slides)
- Screenshots/Demo placeholders
- Results & Analysis
- Advantages & Limitations
- Future Scope
- Conclusion
- References placeholder

Project Title: ${projectTitle}
Description: ${projectDescription}
Tech Stack: ${techStack || 'Not specified'}

For each slide, provide: Slide Title, Bullet Points, and Speaker Notes. Format in markdown.`,

      uml: `Generate comprehensive UML diagram descriptions for the following academic project. Include textual descriptions that can be used to create these diagrams:

1. **Use Case Diagram** - List all actors and use cases with relationships
2. **Class Diagram** - Define all classes with attributes, methods, and relationships
3. **Sequence Diagram** - Show key interactions between objects for main flows
4. **Activity Diagram** - Show the workflow/process flow
5. **ER Diagram** - Database entity-relationship design
6. **Data Flow Diagram (DFD)** - Level 0 and Level 1
7. **System Architecture Diagram** - High-level component layout
8. **Deployment Diagram** - Server/client deployment structure

Project Title: ${projectTitle}
Description: ${projectDescription}
Tech Stack: ${techStack || 'Not specified'}

For each diagram, provide detailed textual descriptions with all entities, relationships, and labels. Use markdown formatting with proper headings and structured lists. Include PlantUML or Mermaid syntax where possible so students can paste and render them.`,

      all: `Generate a COMPLETE academic project documentation package for the following project. Include ALL of the following sections:

## PART 1: ABSTRACT
- Title, Abstract (250-300 words), Introduction, Objectives, Methodology, Expected Results, Conclusion

## PART 2: PPT OUTLINE  
Slide-by-slide content (Title Slide, Problem Statement, Objectives, Architecture, Methodology, Tech Stack, Implementation, Results, Future Scope, Conclusion, References)

## PART 3: UML DIAGRAMS
Textual descriptions + Mermaid/PlantUML code for:
- Use Case Diagram
- Class Diagram  
- Sequence Diagram
- Activity Diagram
- ER Diagram
- Data Flow Diagram
- System Architecture
- Deployment Diagram

Project Title: ${projectTitle}
Description: ${projectDescription}
Tech Stack: ${techStack || 'Not specified'}

Format everything in clean markdown with clear section breaks.`,
    };

    const systemPrompt = "You are an expert academic project documentation assistant. Generate detailed, well-structured, and professional academic documentation. Use proper academic language. Include practical and realistic content that would be appropriate for a B.Tech/B.E. level project submission.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompts[docType] || prompts.all },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-project-docs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
