export interface InterviewContext {
  candidateName: string;
  jobRole: string;
  experienceLevel: string;
  jobDescription: string;
  companyName: string;
  resumeData?: {
    skills: string[];
    experience: string;
    education: string;
  };
}

export interface ElevenLabsAgentConfig {
  agentId: string;
  context: InterviewContext;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onTranscript?: (text: string) => void;
}

declare global {
  interface Window {
    elevenLabsConvAI?: any;
  }
}

export class ElevenLabsInterviewAgent {
  private agentId: string;
  private context: InterviewContext;
  private widget: any = null;
  private isInitialized = false;
  private onCallStart?: () => void;
  private onCallEnd?: () => void;
  private onTranscript?: (text: string) => void;

  constructor(config: ElevenLabsAgentConfig) {
    this.agentId = config.agentId;
    this.context = config.context;
    this.onCallStart = config.onCallStart;
    this.onCallEnd = config.onCallEnd;
    this.onTranscript = config.onTranscript;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Agent already initialized');
      return;
    }

    await this.loadWidget();
    await this.configureAgent();

    this.isInitialized = true;
    console.log('ElevenLabs Interview Agent initialized');
  }

  private async loadWidget(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('elevenlabs-convai-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'elevenlabs-convai-script';
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';

      script.onload = () => {
        console.log('ElevenLabs widget loaded');
        setTimeout(resolve, 500);
      };

      script.onerror = () => reject(new Error('Failed to load ElevenLabs widget'));

      document.body.appendChild(script);
    });
  }

  private async configureAgent(): Promise<void> {
    const systemPrompt = this.generateSystemPrompt();

    const widgetElement = document.createElement('elevenlabs-convai');
    widgetElement.setAttribute('agent-id', this.agentId);
    widgetElement.style.display = 'none';

    document.body.appendChild(widgetElement);

    this.widget = widgetElement;

    console.log('Agent configured with context:', this.context);
  }

  private generateSystemPrompt(): string {
    const { candidateName, jobRole, experienceLevel, jobDescription, companyName, resumeData } = this.context;

    let prompt = `You are Sarah, a professional HR interviewer conducting an interview for ${companyName || 'a company'}.

CANDIDATE INFORMATION:
- Name: ${candidateName}
- Target Role: ${jobRole}
- Experience Level: ${experienceLevel}
- Job Description: ${jobDescription}

`;

    if (resumeData) {
      prompt += `RESUME HIGHLIGHTS:
- Skills: ${resumeData.skills.join(', ')}
- Experience: ${resumeData.experience}
- Education: ${resumeData.education}

`;
    }

    prompt += `INTERVIEW INSTRUCTIONS:
1. Start with: "Hello ${candidateName}! I'm Sarah, your AI interviewer today. I'll be asking you questions tailored to the ${jobRole} role. Answer naturally and I'll provide detailed feedback. Let's begin!"

2. Ask 8 relevant questions based on:
   - The job description
   - Their experience level (${experienceLevel})
   - Skills mentioned in their resume
   - Role-specific competencies

3. Question types to cover:
   - Warm-up: Background and motivation (2 questions)
   - Technical: Skills and experience (3 questions)
   - Behavioral: Situations and problem-solving (2 questions)
   - Closing: Questions for us and wrap-up (1 question)

4. After each answer:
   - Acknowledge briefly
   - Move to next question naturally
   - Don't ask "Do you have anything to add?"

5. Keep questions concise and clear
6. Adapt follow-ups based on their answers
7. Maintain professional yet conversational tone

8. After 8 questions, say: "Thank you for completing this interview! I'll now generate your performance report with detailed feedback. You'll see your results momentarily. Great job today!"

IMPORTANT:
- Don't repeat questions
- Don't ask permission to continue
- Flow naturally from question to question
- Keep the interview professional and efficient
`;

    return prompt;
  }

  async startInterview(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.widget) {
      try {
        const startButton = this.widget.shadowRoot?.querySelector('button');
        if (startButton) {
          startButton.click();
          this.onCallStart?.();
          console.log('Interview call started');
        }
      } catch (error) {
        console.error('Failed to start interview:', error);
      }
    }
  }

  async endInterview(): Promise<void> {
    if (this.widget) {
      try {
        const endButton = this.widget.shadowRoot?.querySelector('[data-action="end"]');
        if (endButton) {
          (endButton as HTMLElement).click();
          this.onCallEnd?.();
          console.log('Interview call ended');
        }
      } catch (error) {
        console.error('Failed to end interview:', error);
      }
    }
  }

  destroy(): void {
    if (this.widget) {
      this.widget.remove();
      this.widget = null;
    }

    const script = document.getElementById('elevenlabs-convai-script');
    if (script) {
      script.remove();
    }

    this.isInitialized = false;
    console.log('Agent destroyed');
  }

  getContext(): InterviewContext {
    return { ...this.context };
  }

  updateContext(updates: Partial<InterviewContext>): void {
    this.context = { ...this.context, ...updates };
    console.log('Context updated:', updates);
  }
}

export const createInterviewAgent = (config: ElevenLabsAgentConfig): ElevenLabsInterviewAgent => {
  return new ElevenLabsInterviewAgent(config);
};
