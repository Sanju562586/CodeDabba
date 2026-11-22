import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AiChatLog } from '../../entities/ai-chat-log.entity';
import { Course } from '../../entities/course.entity';
import { Chapter } from '../../entities/chapter.entity';
import { LessonBlock } from '../../entities/lesson-block.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly dailyLimit = 20;

  constructor(
    @InjectRepository(AiChatLog)
    private aiChatLogRepository: Repository<AiChatLog>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(LessonBlock)
    private blockRepository: Repository<LessonBlock>,
  ) {}

  /**
   * Get start of current day in UTC
   */
  private getStartOfToday(): Date {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Check remaining daily queries for the student
   */
  async getDailyQuota(userId: string): Promise<{
    usedToday: number;
    remainingQuota: number;
    dailyLimit: number;
  }> {
    const startOfToday = this.getStartOfToday();
    const usedToday = await this.aiChatLogRepository.count({
      where: {
        userId,
        createdAt: MoreThanOrEqual(startOfToday),
      },
    });

    return {
      usedToday,
      remainingQuota: Math.max(0, this.dailyLimit - usedToday),
      dailyLimit: this.dailyLimit,
    };
  }

  /**
   * Chat with AI using course & chapter context and enforcing daily caps
   */
  async chatWithAi(
    userId: string,
    message: string,
    courseId?: string,
    chapterId?: string,
  ): Promise<{
    reply: string;
    remainingQuota: number;
    dailyLimit: number;
  }> {
    // 1. Enforce Daily Limit
    const { usedToday, remainingQuota } = await this.getDailyQuota(userId);
    if (remainingQuota <= 0) {
      throw new BadRequestException(
        `Daily AI assistance quota reached (${this.dailyLimit}/${this.dailyLimit} questions used today). Please try again tomorrow.`,
      );
    }

    // 2. Build Contextual System Prompt
    let contextHeader = 'You are CodeDabba AI, an encouraging and expert technical teaching assistant for students.\n';

    if (courseId) {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });
      if (course) {
        contextHeader += `The student is enrolled in the course: "${course.title}" (${course.level} level).\n`;
      }
    }

    if (chapterId) {
      const chapter = await this.chapterRepository.findOne({
        where: { id: chapterId },
      });
      if (chapter) {
        contextHeader += `Current Lesson / Chapter: "${chapter.title}".\n`;

        // Gather chapter notes / lesson content snippet
        const blocks = await this.blockRepository.find({
          where: { chapterId },
          order: { orderIndex: 'ASC' },
          take: 3,
        });

        const snippet = blocks
          .filter((b) => b.type === 'text')
          .map((b) => b.content)
          .join('\n')
          .slice(0, 800);

        if (snippet) {
          contextHeader += `Key lesson context:\n${snippet}\n`;
        }
      }
    }

    contextHeader += `\nGuidelines:
- Explain programming concepts clearly and patiently with markdown code examples.
- Do NOT provide direct copy-paste cheat solutions for exercises; provide conceptual hints and explain why logic works.
- Keep responses concise, direct, and pedagogical.`;

    // 3. Call AI API or Fallback
    const reply = await this.generateAiResponse(contextHeader, message);

    // 4. Log interaction
    const log = this.aiChatLogRepository.create({
      userId,
      courseId: courseId || undefined,
      chapterId: chapterId || undefined,
      userMessage: message,
      aiReply: reply,
    });
    await this.aiChatLogRepository.save(log);

    return {
      reply,
      remainingQuota: remainingQuota - 1,
      dailyLimit: this.dailyLimit,
    };
  }

  /**
   * Generate response from Gemini API or pedagogical fallback
   */
  private async generateAiResponse(systemContext: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

    if (apiKey && apiKey !== 'your-gemini-key' && !apiKey.includes('re_')) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemContext}\n\nStudent question: ${userPrompt}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text.trim();
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini API call failed: ${err.message}. Using built-in pedagogical responder.`);
      }
    }

    // Built-in Pedagogical Responder
    return this.generatePedagogicalFallback(userPrompt);
  }

  private generatePedagogicalFallback(prompt: string): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('hint') || lower.includes('task') || lower.includes('error') || lower.includes('bug')) {
      return `💡 **CodeDabba Assistant Hint**:

When troubleshooting or implementing this step:
1. **Understand Input/Output**: Verify what arguments your function receives and the expected return format.
2. **Edge Cases**: Check empty values, negative numbers, or off-by-one loops (\`range(len(arr))\` vs \`range(len(arr) - 1)\`).
3. **Print Debugging**: Try printing variable values right before returning to trace logic step by step.

*Feel free to share the exact line causing you trouble for more targeted hints!*`;
    }

    if (lower.includes('explain') || lower.includes('how') || lower.includes('what is')) {
      return `📘 **Concept Breakdown**:

In programming, this concept breaks down into three key ideas:
1. **The Purpose**: It gives your program structure and predictability without having to duplicate code.
2. **The Syntax**: Remember that proper formatting, indentation, and variable naming make code self-documenting.
3. **Real-World Practice**: Try altering values in your editor and re-running test cases to see how behavior changes.

Let me know if you would like an example in Python or JavaScript!`;
    }

    return `👋 **CodeDabba AI Teaching Assistant**:

I am reviewing your lesson context. 

To best help you:
- If you're stuck on a task, write down your thought process or what error message you see.
- If you're exploring a concept, let me know which specific line or paragraph from the notes you'd like explained in simpler terms.

Keep experimenting—writing code and testing is the fastest way to learn!`;
  }
}
