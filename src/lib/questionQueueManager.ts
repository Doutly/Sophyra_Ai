import { supabase } from './supabase';

export interface Question {
  id: string;
  question: string;
  number: number;
  timestamp: number;
  asked: boolean;
  answered: boolean;
  answer?: string;
  skipped: boolean;
}

export interface QueueState {
  sessionId: string;
  currentIndex: number;
  questions: Question[];
  totalQuestions: number;
  isComplete: boolean;
}

export class QuestionQueueManager {
  private state: QueueState;
  private readonly STORAGE_KEY_PREFIX = 'interview_queue_';

  constructor(sessionId: string, totalQuestions: number = 8) {
    this.state = {
      sessionId,
      currentIndex: 0,
      questions: [],
      totalQuestions,
      isComplete: false,
    };
  }

  async initialize(): Promise<void> {
    const savedState = await this.loadFromDatabase();
    if (savedState) {
      this.state = savedState;
      console.log('Loaded queue state from database:', this.state);
    } else {
      await this.saveToDatabase();
      console.log('Initialized new queue state');
    }
  }

  addQuestion(question: string): Question {
    const questionObj: Question = {
      id: `q_${Date.now()}_${this.state.questions.length}`,
      question,
      number: this.state.questions.length + 1,
      timestamp: Date.now(),
      asked: false,
      answered: false,
      skipped: false,
    };

    this.state.questions.push(questionObj);
    this.saveToDatabase();

    console.log(`Added question ${questionObj.number}/${this.state.totalQuestions}`);
    return questionObj;
  }

  markAsAsked(questionNumber: number): void {
    const question = this.state.questions.find(q => q.number === questionNumber);
    if (question) {
      question.asked = true;
      this.saveToDatabase();
      console.log(`Marked question ${questionNumber} as asked`);
    }
  }

  markAsAnswered(questionNumber: number, answer: string): void {
    const question = this.state.questions.find(q => q.number === questionNumber);
    if (question) {
      question.answered = true;
      question.answer = answer;
      this.saveToDatabase();
      console.log(`Marked question ${questionNumber} as answered`);
    }
  }

  getCurrentQuestion(): Question | null {
    if (this.state.currentIndex >= this.state.questions.length) {
      return null;
    }
    return this.state.questions[this.state.currentIndex];
  }

  getCurrentQuestionNumber(): number {
    return this.state.currentIndex + 1;
  }

  hasNextQuestion(): boolean {
    return this.state.currentIndex < this.state.totalQuestions - 1 &&
           this.state.currentIndex < this.state.questions.length - 1;
  }

  moveToNext(): boolean {
    if (!this.hasNextQuestion()) {
      this.state.isComplete = true;
      this.saveToDatabase();
      console.log('Interview complete - no more questions');
      return false;
    }

    this.state.currentIndex++;
    this.saveToDatabase();

    console.log(`Advanced to question ${this.getCurrentQuestionNumber()}/${this.state.totalQuestions}`);
    return true;
  }

  canAdvance(): boolean {
    const current = this.getCurrentQuestion();
    if (!current) return false;

    const isAnsweredOrSkipped = current.answered || current.skipped;
    const hasMore = this.hasNextQuestion();

    console.log(`Can advance: answered=${current.answered}, skipped=${current.skipped}, hasMore=${hasMore}`);
    return isAnsweredOrSkipped && hasMore;
  }

  forceAdvance(): boolean {
    console.warn('Force advancing to next question');
    return this.moveToNext();
  }

  skipCurrent(): void {
    const current = this.getCurrentQuestion();
    if (current) {
      current.skipped = true;
      this.saveToDatabase();
      console.log(`Skipped question ${current.number}`);
    }
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.getCurrentQuestionNumber(),
      total: this.state.totalQuestions,
      percentage: (this.state.currentIndex / this.state.totalQuestions) * 100,
    };
  }

  getAnsweredQuestions(): Question[] {
    return this.state.questions.filter(q => q.answered);
  }

  getUnansweredQuestions(): Question[] {
    return this.state.questions.filter(q => !q.answered && !q.skipped);
  }

  isQuestionAlreadyAsked(questionText: string): boolean {
    const normalized = this.normalizeQuestion(questionText);
    return this.state.questions.some(q =>
      this.normalizeQuestion(q.question) === normalized
    );
  }

  private normalizeQuestion(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async validateState(): Promise<boolean> {
    const issues: string[] = [];

    if (this.state.currentIndex < 0) {
      issues.push('Current index is negative');
      this.state.currentIndex = 0;
    }

    if (this.state.currentIndex > this.state.questions.length) {
      issues.push('Current index exceeds question count');
      this.state.currentIndex = Math.min(this.state.currentIndex, this.state.questions.length - 1);
    }

    const duplicates = this.findDuplicateQuestions();
    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate questions`);
    }

    if (issues.length > 0) {
      console.warn('Queue state validation issues:', issues);
      await this.saveToDatabase();
      return false;
    }

    return true;
  }

  private findDuplicateQuestions(): string[] {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const q of this.state.questions) {
      const normalized = this.normalizeQuestion(q.question);
      if (seen.has(normalized)) {
        duplicates.push(q.question);
      }
      seen.add(normalized);
    }

    return duplicates;
  }

  async saveToDatabase(): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          queue_state: JSON.stringify(this.state),
          current_question_number: this.getCurrentQuestionNumber(),
        })
        .eq('id', this.state.sessionId);

      if (error) {
        console.error('Failed to save queue state:', error);
        this.saveToLocalStorage();
      }
    } catch (err) {
      console.error('Error saving queue state:', err);
      this.saveToLocalStorage();
    }
  }

  private async loadFromDatabase(): Promise<QueueState | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('queue_state')
        .eq('id', this.state.sessionId)
        .maybeSingle();

      if (error || !data?.queue_state) {
        return this.loadFromLocalStorage();
      }

      return JSON.parse(data.queue_state);
    } catch (err) {
      console.error('Error loading queue state:', err);
      return this.loadFromLocalStorage();
    }
  }

  private saveToLocalStorage(): void {
    try {
      const key = this.STORAGE_KEY_PREFIX + this.state.sessionId;
      localStorage.setItem(key, JSON.stringify(this.state));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  private loadFromLocalStorage(): QueueState | null {
    try {
      const key = this.STORAGE_KEY_PREFIX + this.state.sessionId;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return null;
    }
  }

  reset(): void {
    this.state.currentIndex = 0;
    this.state.questions = [];
    this.state.isComplete = false;
    this.saveToDatabase();
    console.log('Queue reset');
  }

  getState(): QueueState {
    return { ...this.state };
  }

  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }
}

export const createQuestionQueue = (sessionId: string, totalQuestions?: number): QuestionQueueManager => {
  return new QuestionQueueManager(sessionId, totalQuestions);
};
