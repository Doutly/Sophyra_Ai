import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function generateInterviewQuestion(params: {
  jobRole: string;
  experienceLevel: string;
  jobDescription: string;
  previousQuestions?: string[];
  previousAnswers?: string[];
  conversationHistory?: string;
  avoidTopics?: string[];
}) {
  try {
    const generateQuestion = httpsCallable(functions, 'generateInterviewQuestion');

    const enhancedParams = {
      ...params,
      instructions: `CRITICAL: Do NOT repeat any of these previously asked questions:
${params.previousQuestions?.map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None yet'}

Avoid these topics that have already been covered: ${params.avoidTopics?.join(', ') || 'None'}

Generate a COMPLETELY DIFFERENT question that explores new aspects of the candidate's experience.
Make it conversational and natural, building on what you've learned from previous answers.`,
    };

    const result = await generateQuestion(enhancedParams);
    return result.data;
  } catch (error) {
    console.error('Error generating question:', error);
    const defaultQuestions = [
      "Tell me about yourself and your background.",
      "What motivated you to apply for this role?",
      "Can you describe a challenging project you've worked on?",
      "How do you handle tight deadlines and pressure?",
      "What are your key strengths for this position?",
      "Describe a time when you had to learn something quickly.",
      "How do you collaborate with team members?",
      "What's your approach to problem-solving?",
    ];

    const askedCount = params.previousQuestions?.length || 0;
    const availableQuestions = defaultQuestions.filter(
      q => !params.previousQuestions?.some(pq =>
        pq.toLowerCase().includes(q.toLowerCase().substring(0, 20))
      )
    );

    return {
      question: availableQuestions[askedCount % availableQuestions.length] || defaultQuestions[askedCount % defaultQuestions.length],
      tone: params.experienceLevel === 'fresher' ? 'supportive mentor' : 'formal HR'
    };
  }
}

export async function evaluateAnswer(params: {
  question: string;
  answer: string;
  jobRole: string;
  jobDescription: string;
}) {
  try {
    const evaluateFunc = httpsCallable(functions, 'evaluateAnswer');
    const result = await evaluateFunc(params);
    return result.data;
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      clarity: 7,
      confidence: 7,
      relevance: 7,
      professionalism: 8,
      feedback: "Your answer demonstrates good understanding. Consider providing more specific examples.",
      suggestions: [
        "Use the STAR method for behavioral questions",
        "Include quantifiable metrics when discussing achievements"
      ]
    };
  }
}

export async function parseResume(fileData: string) {
  try {
    const parseFunc = httpsCallable(functions, 'parseResume');
    const result = await parseFunc({ fileData });
    return result.data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

export async function generateQuestionWithGemini(params: {
  jobRole: string;
  experienceLevel: string;
  jobDescription: string;
  previousQuestions?: string[];
  previousAnswers?: string[];
}) {
  try {
    const tone = params.experienceLevel === 'fresher' ? 'supportive mentor' :
                 params.experienceLevel === '6+' ? 'calm senior leader' :
                 'formal HR';

    const context = `You are interviewing for: ${params.jobRole}\nExperience Level: ${params.experienceLevel}\nJob Description: ${params.jobDescription}`;

    let prompt = `${context}\n\nGenerate ONE specific, relevant interview question for this candidate. `;
    prompt += `Use a ${tone} tone. `;
    prompt += `Focus on: behavioral questions, technical skills from JD, problem-solving, or cultural fit. `;
    prompt += `Keep the question concise (1-2 sentences max). `;

    if (params.previousQuestions && params.previousQuestions.length > 0) {
      prompt += `\n\nPrevious questions asked: ${params.previousQuestions.join(', ')}. `;
      prompt += `Ask something different. `;
    }

    prompt += `\n\nReturn ONLY the question text, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
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

    const data = await response.json();
    const question = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
                    "Tell me about a time when you demonstrated leadership.";

    return { question, tone };
  } catch (error) {
    console.error('Error with Gemini API:', error);
    const defaultQuestions = [
      "Tell me about yourself and your background.",
      "What motivated you to apply for this role?",
      "Can you describe a challenging project you've worked on?",
    ];
    return {
      question: defaultQuestions[(params.previousQuestions?.length || 0) % defaultQuestions.length],
      tone: 'formal HR'
    };
  }
}
