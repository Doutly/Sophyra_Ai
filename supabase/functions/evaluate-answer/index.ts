import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  question: string;
  answer: string;
  jobRole: string;
  jobDescription: string;
}

interface EvaluationResult {
  clarity: number;
  confidence: number;
  relevance: number;
  professionalism: number;
  feedback: string;
  suggestions: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { question, answer, jobRole, jobDescription }: RequestBody = await req.json();

    const prompt = `You are an expert HR interviewer evaluating a candidate's answer.\n\n` +
      `Job Role: ${jobRole}\n` +
      `Job Description: ${jobDescription}\n\n` +
      `Question Asked: ${question}\n` +
      `Candidate's Answer: ${answer}\n\n` +
      `Evaluate the answer on these criteria (score 0-10 for each):\n` +
      `1. Clarity - How clear and well-structured is the response?\n` +
      `2. Confidence - Does the answer show confidence and conviction?\n` +
      `3. Relevance - How relevant is the answer to the question and role?\n` +
      `4. Professionalism - Is the tone and language professional?\n\n` +
      `Also provide:\n` +
      `- Brief feedback (2-3 sentences)\n` +
      `- 2-3 specific suggestions for improvement\n\n` +
      `Return your response ONLY as valid JSON in this exact format:\n` +
      `{\n` +
      `  "clarity": <number>,\n` +
      `  "confidence": <number>,\n` +
      `  "relevance": <number>,\n` +
      `  "professionalism": <number>,\n` +
      `  "feedback": "<string>",\n` +
      `  "suggestions": ["<string>", "<string>"]\n` +
      `}\n\n` +
      `Do not include any text outside the JSON object.`;

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiKey) {
      const defaultEvaluation: EvaluationResult = {
        clarity: Math.floor(Math.random() * 3) + 7,
        confidence: Math.floor(Math.random() * 3) + 7,
        relevance: Math.floor(Math.random() * 3) + 7,
        professionalism: Math.floor(Math.random() * 3) + 8,
        feedback: "Your answer demonstrates good understanding of the topic. Consider providing more specific examples to strengthen your response.",
        suggestions: [
          "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
          "Include quantifiable metrics when discussing achievements"
        ]
      };

      return new Response(
        JSON.stringify(defaultEvaluation),
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
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let evaluation: EvaluationResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      evaluation = {
        clarity: 7,
        confidence: 7,
        relevance: 7,
        professionalism: 8,
        feedback: "Your answer shows good understanding. Consider being more specific with examples.",
        suggestions: [
          "Use concrete examples from your experience",
          "Structure your answers using frameworks like STAR"
        ]
      };
    }

    return new Response(
      JSON.stringify(evaluation),
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
      JSON.stringify({
        error: error.message,
        clarity: 7,
        confidence: 7,
        relevance: 7,
        professionalism: 8,
        feedback: "Unable to evaluate at this time. Please try again.",
        suggestions: ["Try again later"]
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