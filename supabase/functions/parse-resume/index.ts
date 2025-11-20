import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const fileType = file.type;
    const fileSize = file.size;

    if (fileSize > 15 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 15MB limit' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let extractedText = '';

    if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8', { fatal: false });
      extractedText = decoder.decode(uint8Array);
      
      extractedText = extractedText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    } else if (fileType === 'text/plain') {
      extractedText = await file.text();
    } else {
      extractedText = await file.text();
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') || 'AIzaSyDaS7WX4dPCaz5vv_X6Spf67ev4VH9AmWo';

    const prompt = `You are a resume parser. Extract the following information from this resume text and return ONLY a valid JSON object with these exact fields:

{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "Brief summary of work experience (2-3 sentences)",
  "education": "Highest degree and institution",
  "summary": "Professional summary or objective (1-2 sentences)"
}

Rules:
- Return ONLY valid JSON, no additional text
- If information is not found, use empty string "" or empty array []
- For skills, extract technical skills, tools, and technologies
- Keep experience and summary concise

Resume text:
${extractedText.substring(0, 8000)}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const geminiData = await geminiResponse.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    
    let parsedData: ParsedResume;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      parsedData = {
        name: '',
        email: '',
        phone: '',
        skills: [],
        experience: '',
        education: '',
        summary: ''
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData,
        rawText: extractedText.substring(0, 1000)
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error parsing resume:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to parse resume',
        success: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});