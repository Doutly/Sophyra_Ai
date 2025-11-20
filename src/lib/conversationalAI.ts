export interface ConversationContext {
  userName?: string;
  jobRole: string;
  experienceLevel: string;
  questionNumber: number;
  totalQuestions: number;
  previousQuestions: string[];
  previousAnswers: string[];
}

const CONVERSATION_OPENERS = [
  "Let's get started! I'm excited to learn more about you.",
  "Great! Let's begin. Take a deep breath, and let's have a conversation.",
  "Wonderful! I'm here to help you showcase your best self. Let's dive in!",
  "Perfect! Think of this as a friendly chat about your career. Ready?",
];

const TRANSITION_PHRASES = [
  "That's insightful! Now, let's explore another aspect...",
  "Interesting perspective! Building on that...",
  "Great answer! Let's dig a bit deeper into...",
  "I appreciate that response. Moving forward...",
  "Excellent! Now I'd like to understand more about...",
];

const ENCOURAGEMENT_PHRASES = [
  "You're doing great so far!",
  "Nice work! Keep it up.",
  "Excellent responses! You're well-prepared.",
  "Strong answers! I'm impressed.",
  "You're on the right track!",
];

const PROGRESS_UPDATES = {
  quarter: "We're about a quarter through. You're doing well!",
  half: "We're halfway there! Great job so far.",
  threeQuarters: "Almost done! Just a few more questions.",
  final: "This is our final question. You've done excellently!",
};

export class ConversationalAI {
  private context: ConversationContext;

  constructor(context: ConversationContext) {
    this.context = context;
  }

  getConversationalIntro(): string {
    const opener = CONVERSATION_OPENERS[
      Math.floor(Math.random() * CONVERSATION_OPENERS.length)
    ];

    return opener;
  }

  addConversationalWrapper(question: string): string {
    const { questionNumber, totalQuestions } = this.context;

    let prefix = '';

    if (questionNumber === 1) {
      prefix = this.getConversationalIntro() + ' ';
    } else {
      const transitionPhrase = TRANSITION_PHRASES[
        Math.floor(Math.random() * TRANSITION_PHRASES.length)
      ];
      prefix = transitionPhrase + ' ';
    }

    const progressRatio = questionNumber / totalQuestions;
    let progressUpdate = '';

    if (questionNumber === Math.floor(totalQuestions * 0.25) && questionNumber > 1) {
      progressUpdate = ` ${PROGRESS_UPDATES.quarter}`;
    } else if (questionNumber === Math.floor(totalQuestions * 0.5)) {
      progressUpdate = ` ${PROGRESS_UPDATES.half}`;
    } else if (questionNumber === Math.floor(totalQuestions * 0.75)) {
      progressUpdate = ` ${PROGRESS_UPDATES.threeQuarters}`;
    } else if (questionNumber === totalQuestions) {
      progressUpdate = ` ${PROGRESS_UPDATES.final}`;
    }

    return prefix + question + progressUpdate;
  }

  getEncouragementPhrase(): string {
    return ENCOURAGEMENT_PHRASES[
      Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length)
    ];
  }

  generatePersonalizedFollowUp(answer: string, question: string): string | null {
    const answerLength = answer.trim().split(/\s+/).length;

    if (answerLength < 20) {
      return "I'd love to hear more details about that. Could you elaborate a bit?";
    }

    if (answer.toLowerCase().includes('i don\'t know') ||
        answer.toLowerCase().includes('not sure')) {
      return "No worries! Let's approach this differently. Can you share a related experience?";
    }

    const hasExample = answer.toLowerCase().includes('example') ||
                       answer.toLowerCase().includes('instance') ||
                       answer.toLowerCase().includes('time when');

    if (!hasExample && answerLength > 30) {
      return "Great answer! Could you give me a specific example to illustrate that?";
    }

    return null;
  }

  shouldUseAI(task: string): boolean {
    const nonAITasks = [
      'validate_file',
      'format_date',
      'calculate_score',
      'sort_data',
      'filter_results',
      'count_words',
      'detect_filler_words',
      'calculate_wpm',
      'format_time',
    ];

    return !nonAITasks.some(t => task.toLowerCase().includes(t));
  }

  calculateWordsPerMinute(wordCount: number, seconds: number): number {
    if (seconds === 0) return 0;
    return Math.round((wordCount / seconds) * 60);
  }

  detectFillerWords(text: string): { count: number; words: string[] } {
    const fillerPatterns = [
      /\b(um|uh|like|you know|actually|basically|literally|honestly|obviously|I mean|sort of|kind of)\b/gi
    ];

    const matches: string[] = [];
    fillerPatterns.forEach(pattern => {
      const found = text.match(pattern);
      if (found) matches.push(...found);
    });

    return {
      count: matches.length,
      words: [...new Set(matches.map(w => w.toLowerCase()))],
    };
  }

  analyzeAnswerStructure(answer: string): {
    hasIntro: boolean;
    hasExample: boolean;
    hasConclusion: boolean;
    structure: string;
  } {
    const lowerAnswer = answer.toLowerCase();

    const introIndicators = ['first', 'to start', 'initially', 'in my experience'];
    const exampleIndicators = ['for example', 'for instance', 'such as', 'specifically', 'once', 'when i'];
    const conclusionIndicators = ['in conclusion', 'ultimately', 'overall', 'to summarize', 'therefore'];

    const hasIntro = introIndicators.some(ind => lowerAnswer.includes(ind));
    const hasExample = exampleIndicators.some(ind => lowerAnswer.includes(ind));
    const hasConclusion = conclusionIndicators.some(ind => lowerAnswer.includes(ind));

    let structure = 'Unstructured';
    if (hasIntro && hasExample && hasConclusion) {
      structure = 'Well-structured (STAR-like)';
    } else if (hasExample) {
      structure = 'Example-driven';
    } else if (hasIntro || hasConclusion) {
      structure = 'Partially structured';
    }

    return { hasIntro, hasExample, hasConclusion, structure };
  }

  generateQuickFeedback(answer: string, question: string): string {
    const wordCount = answer.trim().split(/\s+/).length;
    const fillerWords = this.detectFillerWords(answer);
    const structure = this.analyzeAnswerStructure(answer);

    const feedback: string[] = [];

    if (wordCount < 20) {
      feedback.push("Try to provide more detailed responses");
    } else if (wordCount > 200) {
      feedback.push("Consider being more concise");
    } else {
      feedback.push("Good response length");
    }

    if (fillerWords.count === 0) {
      feedback.push("Clear and confident delivery");
    } else if (fillerWords.count < 3) {
      feedback.push("Mostly clear with minimal filler words");
    } else {
      feedback.push(`Watch out for filler words (${fillerWords.count} detected)`);
    }

    if (structure.hasExample) {
      feedback.push("Great use of examples");
    } else if (wordCount > 30) {
      feedback.push("Consider adding a specific example");
    }

    return feedback.join('. ') + '.';
  }

  getConversationalClosing(): string {
    return "That concludes our interview! You did a fantastic job. I'll generate your detailed performance report now. Take a moment to relax while I analyze your responses.";
  }
}

export function shouldUseAIForTask(taskDescription: string): {
  useAI: boolean;
  reason: string;
  alternative?: string;
} {
  const simplePatterns = {
    calculation: /calculate|count|sum|average|total/i,
    formatting: /format|convert|transform|parse/i,
    validation: /validate|check|verify|confirm/i,
    sorting: /sort|order|arrange|organize/i,
    filtering: /filter|search|find|select/i,
  };

  for (const [category, pattern] of Object.entries(simplePatterns)) {
    if (pattern.test(taskDescription)) {
      return {
        useAI: false,
        reason: `${category} tasks are better handled with traditional programming`,
        alternative: `Use built-in ${category} functions for better performance`,
      };
    }
  }

  const aiPatterns = {
    generation: /generate|create|write|compose/i,
    analysis: /analyze|evaluate|assess|review/i,
    understanding: /understand|interpret|explain|summarize/i,
    personalization: /personalize|customize|tailor|adapt/i,
  };

  for (const [category, pattern] of Object.entries(aiPatterns)) {
    if (pattern.test(taskDescription)) {
      return {
        useAI: true,
        reason: `${category} benefits from AI capabilities`,
      };
    }
  }

  return {
    useAI: false,
    reason: 'Default to traditional approach for better performance',
    alternative: 'Use standard programming logic',
  };
}
