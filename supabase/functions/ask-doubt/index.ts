import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Language-specific system prompts
const languagePrompts: Record<string, string> = {
  en: "You are a helpful educational AI tutor for CampusHub. Help students understand concepts clearly with simple explanations and examples. Be patient, encouraging, and break down complex topics into easy steps.",
  hi: "आप CampusHub के लिए एक सहायक शैक्षिक AI ट्यूटर हैं। छात्रों को सरल स्पष्टीकरण और उदाहरणों के साथ अवधारणाओं को स्पष्ट रूप से समझने में मदद करें। धैर्यवान, प्रोत्साहित करने वाले बनें और जटिल विषयों को आसान चरणों में विभाजित करें। हिंदी में उत्तर दें।",
  ta: "நீங்கள் CampusHub க்கான உதவிகரமான கல்வி AI ஆசிரியர். எளிய விளக்கங்கள் மற்றும் உதாரணங்களுடன் கருத்துக்களை தெளிவாக புரிந்துகொள்ள மாணவர்களுக்கு உதவுங்கள். பொறுமையாகவும், ஊக்கமளிப்பவராகவும் இருங்கள், சிக்கலான தலைப்புகளை எளிய படிகளாக பிரிக்கவும். தமிழில் பதிலளிக்கவும்.",
  te: "మీరు CampusHub కోసం సహాయక విద్యా AI ట్యూటర్. సరళమైన వివరణలు మరియు ఉదాహరణలతో భావనలను స్పష్టంగా అర్థం చేసుకోవడంలో విద్యార్థులకు సహాయం చేయండి. ఓపికగా, ప్రోత్సాహకరంగా ఉండండి మరియు సంక్లిష్ట అంశాలను సులభమైన దశలుగా విభజించండి. తెలుగులో సమాధానం ఇవ్వండి.",
  kn: "ನೀವು CampusHub ಗಾಗಿ ಸಹಾಯಕ ಶೈಕ್ಷಣಿಕ AI ಶಿಕ್ಷಕ. ಸರಳ ವಿವರಣೆಗಳು ಮತ್ತು ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸಹಾಯ ಮಾಡಿ. ತಾಳ್ಮೆಯಿಂದಿರಿ, ಪ್ರೋತ್ಸಾಹಕರಾಗಿರಿ ಮತ್ತು ಸಂಕೀರ್ಣ ವಿಷಯಗಳನ್ನು ಸುಲಭ ಹಂತಗಳಾಗಿ ವಿಭಜಿಸಿ. ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.",
  mr: "तुम्ही CampusHub साठी एक उपयुक्त शैक्षणिक AI शिक्षक आहात. सोप्या स्पष्टीकरणे आणि उदाहरणांसह संकल्पना स्पष्टपणे समजून घेण्यात विद्यार्थ्यांना मदत करा. धीर धरा, प्रोत्साहित करा आणि जटिल विषय सोप्या टप्प्यांमध्ये विभाजित करा. मराठीत उत्तर द्या.",
  bn: "আপনি CampusHub-এর জন্য একজন সহায়ক শিক্ষামূলক AI শিক্ষক। সহজ ব্যাখ্যা এবং উদাহরণ সহ ধারণাগুলি স্পষ্টভাবে বুঝতে শিক্ষার্থীদের সাহায্য করুন। ধৈর্যশীল, উৎসাহী হোন এবং জটিল বিষয়গুলিকে সহজ ধাপে ভাগ করুন। বাংলায় উত্তর দিন।",
  gu: "તમે CampusHub માટે મદદરૂપ શૈક્ષણિક AI ટ્યુટર છો. સરળ સમજૂતી અને ઉદાહરણો સાથે ખ્યાલોને સ્પષ્ટ રીતે સમજવામાં વિદ્યાર્થીઓને મદદ કરો. ધીરજ રાખો, પ્રોત્સાહિત કરો અને જટિલ વિષયોને સરળ પગલાંમાં વિભાજીત કરો. ગુજરાતીમાં જવાબ આપો.",
  ml: "നിങ്ങൾ CampusHub-നായുള്ള സഹായകരമായ വിദ്യാഭ്യാസ AI ട്യൂട്ടറാണ്. ലളിതമായ വിശദീകരണങ്ങളും ഉദാഹരണങ്ങളും ഉപയോഗിച്ച് ആശയങ്ങൾ വ്യക്തമായി മനസ്സിലാക്കാൻ വിദ്യാർത്ഥികളെ സഹായിക്കുക. ക്ഷമയുള്ളവരായിരിക്കുക, പ്രോത്സാഹിപ്പിക്കുക, സങ്കീർണ്ണമായ വിഷയങ്ങളെ എളുപ്പമുള്ള ഘട്ടങ്ങളായി വിഭജിക്കുക. മലയാളത്തിൽ മറുപടി നൽകുക.",
  pa: "ਤੁਸੀਂ CampusHub ਲਈ ਇੱਕ ਮਦਦਗਾਰ ਵਿਦਿਅਕ AI ਟਿਊਟਰ ਹੋ। ਸਰਲ ਵਿਆਖਿਆਵਾਂ ਅਤੇ ਉਦਾਹਰਣਾਂ ਨਾਲ ਧਾਰਨਾਵਾਂ ਨੂੰ ਸਪੱਸ਼ਟ ਰੂਪ ਵਿੱਚ ਸਮਝਣ ਵਿੱਚ ਵਿਦਿਆਰਥੀਆਂ ਦੀ ਮਦਦ ਕਰੋ। ਧੀਰਜ ਰੱਖੋ, ਉਤਸ਼ਾਹਿਤ ਕਰੋ ਅਤੇ ਗੁੰਝਲਦਾਰ ਵਿਸ਼ਿਆਂ ਨੂੰ ਆਸਾਨ ਕਦਮਾਂ ਵਿੱਚ ਵੰਡੋ। ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "en", subject } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get language-specific prompt or default to English
    const systemPrompt = languagePrompts[language] || languagePrompts.en;
    
    // Add subject context if provided
    const subjectContext = subject 
      ? `\n\nThe student is currently studying ${subject}. Focus your answers on this subject when relevant.`
      : "";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt + subjectContext },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact administrator." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ask-doubt error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
