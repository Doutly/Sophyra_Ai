export interface ConversationTurn {
  questionNumber: number;
  question: string;
  answer: string;
  timestamp: number;
  topics: string[];
}

export interface ConversationState {
  sessionId: string;
  turns: ConversationTurn[];
  askedQuestions: Set<string>;
  coveredTopics: Set<string>;
  currentTopic: string | null;
  lastUpdateTime: number;
}

export class ConversationStateManager {
  private state: ConversationState;

  constructor(sessionId: string) {
    this.state = {
      sessionId,
      turns: [],
      askedQuestions: new Set(),
      coveredTopics: new Set(),
      currentTopic: null,
      lastUpdateTime: Date.now(),
    };
  }

  addTurn(question: string, answer: string, topics: string[] = []): void {
    const turn: ConversationTurn = {
      questionNumber: this.state.turns.length + 1,
      question,
      answer,
      timestamp: Date.now(),
      topics,
    };

    this.state.turns.push(turn);
    this.state.askedQuestions.add(this.normalizeQuestion(question));
    topics.forEach(topic => this.state.coveredTopics.add(topic.toLowerCase()));
    this.state.lastUpdateTime = Date.now();
  }

  hasAskedSimilarQuestion(question: string, threshold: number = 0.8): boolean {
    const normalized = this.normalizeQuestion(question);

    if (this.state.askedQuestions.has(normalized)) {
      return true;
    }

    for (const askedQ of this.state.askedQuestions) {
      if (this.calculateSimilarity(normalized, askedQ) >= threshold) {
        return true;
      }
    }

    return false;
  }

  hasDiscussedTopic(topic: string): boolean {
    return this.state.coveredTopics.has(topic.toLowerCase());
  }

  getRecentAnswers(count: number = 3): string[] {
    return this.state.turns
      .slice(-count)
      .map(turn => turn.answer)
      .filter(Boolean);
  }

  getRecentQuestions(count: number = 5): string[] {
    return this.state.turns
      .slice(-count)
      .map(turn => turn.question)
      .filter(Boolean);
  }

  getAllAskedQuestions(): string[] {
    return Array.from(this.state.askedQuestions);
  }

  getConversationHistory(): string {
    return this.state.turns
      .map(turn => `Q${turn.questionNumber}: ${turn.question}\nA${turn.questionNumber}: ${turn.answer}`)
      .join('\n\n');
  }

  getTurnCount(): number {
    return this.state.turns.length;
  }

  setCurrentTopic(topic: string): void {
    this.state.currentTopic = topic;
  }

  getCurrentTopic(): string | null {
    return this.state.currentTopic;
  }

  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  exportState(): string {
    return JSON.stringify({
      ...this.state,
      askedQuestions: Array.from(this.state.askedQuestions),
      coveredTopics: Array.from(this.state.coveredTopics),
    });
  }

  importState(stateJson: string): void {
    const parsed = JSON.parse(stateJson);
    this.state = {
      ...parsed,
      askedQuestions: new Set(parsed.askedQuestions),
      coveredTopics: new Set(parsed.coveredTopics),
    };
  }

  reset(): void {
    this.state.turns = [];
    this.state.askedQuestions.clear();
    this.state.coveredTopics.clear();
    this.state.currentTopic = null;
    this.state.lastUpdateTime = Date.now();
  }
}

export const createConversationState = (sessionId: string): ConversationStateManager => {
  return new ConversationStateManager(sessionId);
};
