import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  jobRole: string;
  experienceLevel: string;
  jobDescription: string;
  previousQuestions?: string[];
  previousAnswers?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { jobRole, experienceLevel, jobDescription, previousQuestions, previousAnswers }: RequestBody = await req.json();

    const tone = experienceLevel === 'fresher' ? 'supportive mentor' :
                 experienceLevel === '6+' ? 'calm senior leader' :
                 'formal HR';

    const context = `You are interviewing for: ${jobRole}\nExperience Level: ${experienceLevel}\nJob Description: ${jobDescription}`;
    
    let prompt = `${context}\n\nGenerate ONE specific, relevant interview question for this candidate. `;
    prompt += `Use a ${tone} tone. `;
    prompt += `Focus on: behavioral questions, technical skills from JD, problem-solving, or cultural fit. `;
    prompt += `Keep the question concise (1-2 sentences max). `;
    
    if (previousQuestions && previousQuestions.length > 0) {
      prompt += `\n\nPrevious questions asked: ${previousQuestions.join(', ')}. `;
      prompt += `Ask something different and follow up based on their experience. `;
    }
    
    if (previousAnswers && previousAnswers.length > 0 && previousAnswers[previousAnswers.length - 1]) {
      prompt += `\n\nTheir last answer was: "${previousAnswers[previousAnswers.length - 1]}". `;
      prompt += `If it was vague or incomplete, ask a probing follow-up. `;
    }
    
    prompt += `\n\nReturn ONLY the question text, nothing else.`;

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      const defaultQuestions = [
        "Tell me about yourself and your background.",
        "What motivated you to apply for this role?",
        "Can you describe a challenging project you've worked on?",
        "How do you handle tight deadlines and pressure?",
        "Tell me about a time when you had to work with a difficult team member.",
        "What are your greatest strengths and how do they apply to this role?",
        "Where do you see yourself in the next 3-5 years?",
        "Do you have any questions for us?"
      ];
      
      const questionIndex = (previousQuestions?.length || 0) % defaultQuestions.length;
      
      return new Response(
        JSON.stringify({ question: defaultQuestions[questionIndex], tone }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

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
    const question = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 
                    "Tell me about a time when you demonstrated leadership in a challenging situation.";

    return new Response(
      JSON.stringify({ question, tone }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, question: "Tell me about yourself and your background." }),
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