export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  summary: string;
  linkedIn?: string;
  github?: string;
  website?: string;
}

export interface ParseOptions {
  maxFileSize?: number;
  supportedFormats?: string[];
}

const DEFAULT_OPTIONS: ParseOptions = {
  maxFileSize: 15 * 1024 * 1024,
  supportedFormats: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export class ResumeParser {
  private geminiApiKey: string;

  constructor(apiKey?: string) {
    this.geminiApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  async parseResume(file: File, options: ParseOptions = {}): Promise<ParsedResume> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    this.validateFile(file, opts);

    const text = await this.extractText(file);

    const parsedData = await this.parseWithAI(text);

    return parsedData;
  }

  private validateFile(file: File, options: ParseOptions): void {
    if (file.size > options.maxFileSize!) {
      throw new Error(`File size exceeds ${this.formatBytes(options.maxFileSize!)} limit`);
    }

    if (!options.supportedFormats!.includes(file.type)) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }
  }

  private async extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return await this.extractPDFText(file);
    } else if (file.type === 'text/plain') {
      return await file.text();
    } else if (file.type.includes('word')) {
      return await this.extractWordText(file);
    } else {
      return await file.text();
    }
  }

  private async extractPDFText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let text = decoder.decode(uint8Array);

      text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
      text = text.replace(/\s+/g, ' ');
      text = text.trim();

      const patterns = {
        email: /[\w.-]+@[\w.-]+\.\w+/g,
        phone: /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}/g,
        url: /https?:\/\/[\w.-]+\.\w+[\w\-._~:/?#[\]@!$&'()*+,;=]*/g,
      };

      let extractedInfo = {
        emails: [...text.matchAll(patterns.email)].map(m => m[0]),
        phones: [...text.matchAll(patterns.phone)].map(m => m[0]),
        urls: [...text.matchAll(patterns.url)].map(m => m[0]),
      };

      return text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractWordText(file: File): Promise<string> {
    try {
      const text = await file.text();
      return text.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  private async parseWithAI(text: string): Promise<ParsedResume> {
    const prompt = `You are an expert resume parser. Extract the following information from this resume text and return ONLY a valid JSON object with these exact fields:

{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "Brief summary of work experience (2-3 sentences max)",
  "education": "Highest degree and institution",
  "summary": "Professional summary or objective (1-2 sentences max)",
  "linkedIn": "LinkedIn profile URL if found",
  "github": "GitHub profile URL if found",
  "website": "Personal website URL if found"
}

Important rules:
1. Return ONLY valid JSON, no additional text or markdown
2. If information is not found, use empty string "" or empty array []
3. For skills, extract technical skills, programming languages, tools, frameworks, and technologies
4. Keep experience and summary very concise
5. Extract email using pattern: name@domain.com
6. Extract phone using various formats (e.g., +1-123-456-7890, (123) 456-7890, etc.)
7. Look for LinkedIn, GitHub, and personal website URLs

Resume text (first 8000 characters):
${text.substring(0, 8000)}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 1,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

      let parsedData: ParsedResume;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        parsedData = this.fallbackParse(text);
      }

      parsedData = this.validateParsedData(parsedData);

      return parsedData;
    } catch (error) {
      console.error('AI parsing error:', error);
      return this.fallbackParse(text);
    }
  }

  private fallbackParse(text: string): ParsedResume {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}/);

    const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);

    const skillsSection = text.match(/(?:skills|technologies|expertise)[\s:]+([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\n[A-Z])/i);
    const skills = skillsSection
      ? skillsSection[1].split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
      : [];

    return {
      name: nameMatch?.[1] || '',
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0] || '',
      skills: skills.slice(0, 15),
      experience: '',
      education: '',
      summary: '',
      linkedIn: text.match(/linkedin\.com\/[\w-]+/)?.[0] || '',
      github: text.match(/github\.com\/[\w-]+/)?.[0] || '',
      website: text.match(/https?:\/\/[\w.-]+\.\w+/)?.[0] || ''
    };
  }

  private validateParsedData(data: ParsedResume): ParsedResume {
    return {
      name: data.name || '',
      email: this.validateEmail(data.email) ? data.email : '',
      phone: data.phone || '',
      skills: Array.isArray(data.skills) ? data.skills.filter(Boolean).slice(0, 20) : [],
      experience: data.experience || '',
      education: data.education || '',
      summary: data.summary || '',
      linkedIn: data.linkedIn || '',
      github: data.github || '',
      website: data.website || ''
    };
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    return emailRegex.test(email);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const resumeParser = new ResumeParser();

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  return await resumeParser.parseResume(file);
}

export function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}
