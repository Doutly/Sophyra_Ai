export interface InterviewPhase {
  phase: 'welcome' | 'warmup' | 'technical' | 'behavioral' | 'closing';
  messages: string[];
}

export const PROFESSIONAL_WELCOME = `Hello! Welcome to your interview session. My name is Sarah, and I'll be conducting your interview today. I'm really excited to learn more about you and your experiences.

Before we begin, I want you to know that this is a conversational interview - think of it as a professional discussion rather than a formal interrogation. There are no trick questions here. I'm genuinely interested in understanding your background, your skills, and what you can bring to this role.

Throughout our conversation, I'll be asking you about your experience, your approach to problem-solving, and your career goals. Feel free to take a moment to think before you answer, and don't hesitate to ask if you need any clarification.

Take a deep breath, relax, and let's have a great conversation. Are you ready to get started?`;

export const PHASE_TRANSITIONS = {
  toWarmup: "Great! Let's ease into things with some introductory questions. This will help me get to know you better.",
  toTechnical: "Excellent responses so far! Now I'd like to dive a bit deeper into your technical skills and experience.",
  toBehavioral: "Wonderful! Now let's talk about how you handle different situations at work. I'll be asking you some behavioral questions.",
  toClosing: "We're approaching the end of our interview. Just a couple more questions before we wrap up."
};

export const ENCOURAGEMENT_PHRASES = [
  "That's a great example! I really appreciate the detail you provided.",
  "Excellent answer! Your experience really shines through.",
  "I can see you've given this a lot of thought. That's impressive.",
  "Perfect! That gives me a clear picture of your capabilities.",
  "Great perspective! I like how you approached that challenge.",
  "Wonderful! Your enthusiasm for this is really evident.",
  "That's exactly the kind of insight I was hoping to hear.",
  "Excellent! You clearly have strong experience in this area."
];

export const TRANSITION_PHRASES = [
  "Thank you for sharing that. Building on what you just said,",
  "That's really helpful context. Now, let me ask you about",
  "Great! Moving forward, I'd like to understand more about",
  "I appreciate that answer. Let's shift gears a bit and talk about",
  "Wonderful! That leads nicely into my next question about",
  "Perfect timing for this next question. Let's explore",
  "That's insightful. On a related note,",
  "Excellent! Now I'm curious about"
];

export const BEHAVIORAL_QUESTION_INTRO = [
  "Tell me about a time when",
  "Can you describe a situation where",
  "Give me an example of when",
  "Walk me through an experience when",
  "Share a specific instance when"
];

export const TECHNICAL_QUESTION_INTRO = [
  "How would you approach",
  "What's your experience with",
  "Can you explain your process for",
  "How do you typically handle",
  "What strategies do you use for"
];

export const PROBING_FOLLOW_UPS = [
  "That's interesting! Can you tell me more about that?",
  "I'd love to hear more details about how you handled that.",
  "What was the outcome of that situation?",
  "How did you measure success in that case?",
  "What did you learn from that experience?",
  "How would you approach that differently today?",
  "What challenges did you face, and how did you overcome them?"
];

export const CLOSING_MESSAGES = [
  "We're coming to our final questions now. You've done exceptionally well so far!",
  "Just one or two more questions, and then we'll wrap up. You're doing great!",
  "We're in the home stretch now. I really appreciate the thoughtful answers you've been giving."
];

export const FINAL_FAREWELL = `Thank you so much for your time today! You've provided some really thoughtful and detailed answers throughout this interview. I genuinely enjoyed our conversation and learning more about your background and experiences.

I'll be reviewing everything we discussed and generating a comprehensive performance report for you. This report will include detailed feedback on your responses, areas of strength, and opportunities for improvement.

You should see your results shortly. Before you go, do you have any questions for me about the process or what comes next?

Thank you again, and best of luck! You did a wonderful job today.`;

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function shouldShowEncouragement(questionNumber: number): boolean {
  return questionNumber % 2 === 0 && questionNumber > 1;
}

export function getPhaseTransition(currentPhase: InterviewPhase['phase'], nextPhase: InterviewPhase['phase']): string {
  const key = `to${nextPhase.charAt(0).toUpperCase()}${nextPhase.slice(1)}` as keyof typeof PHASE_TRANSITIONS;
  return PHASE_TRANSITIONS[key] || '';
}

export function determineInterviewPhase(questionNumber: number, totalQuestions: number): InterviewPhase['phase'] {
  const progress = questionNumber / totalQuestions;

  if (questionNumber === 1) return 'warmup';
  if (progress <= 0.25) return 'warmup';
  if (progress <= 0.5) return 'technical';
  if (progress <= 0.85) return 'behavioral';
  return 'closing';
}

export function wrapQuestionWithContext(
  question: string,
  questionNumber: number,
  totalQuestions: number,
  lastPhase: InterviewPhase['phase']
): string {
  const currentPhase = determineInterviewPhase(questionNumber, totalQuestions);
  let prefix = '';
  let suffix = '';

  if (questionNumber === 1) {
    prefix = "Let's start with a question that helps me understand your background. ";
  } else {
    if (currentPhase !== lastPhase) {
      prefix = getPhaseTransition(lastPhase, currentPhase) + ' ';
    } else if (shouldShowEncouragement(questionNumber)) {
      prefix = getRandomElement(ENCOURAGEMENT_PHRASES) + ' ';
    } else {
      prefix = getRandomElement(TRANSITION_PHRASES) + ' ';
    }
  }

  if (questionNumber === totalQuestions) {
    prefix = getRandomElement(CLOSING_MESSAGES) + ' This is my final question: ';
  } else if (questionNumber === totalQuestions - 1) {
    prefix = "We're almost done! Just two more questions. " + prefix;
  }

  return prefix + question + suffix;
}

export function getAnswerAcknowledgment(answerLength: number): string {
  if (answerLength < 20) {
    return "Thanks for that. " + getRandomElement(PROBING_FOLLOW_UPS);
  } else if (answerLength > 100) {
    return "Thank you for such a comprehensive answer! I really appreciate the detail.";
  } else {
    return getRandomElement(ENCOURAGEMENT_PHRASES);
  }
}

export function formatInterviewerMessage(message: string, aiSpeaking: boolean): string {
  return message;
}
