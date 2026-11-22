import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalExam } from '../../entities/final-exam.entity';
import { ExamQuestion } from '../../entities/exam-question.entity';
import {
  ExamAttempt,
  ExamAttemptStatus,
} from '../../entities/exam-attempt.entity';
import { Course } from '../../entities/course.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Progress } from '../../entities/progress.entity';
import { CertificatesService } from '../certificates/certificates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../entities/notification.entity';

@Injectable()
export class FinalExamService {
  constructor(
    @InjectRepository(FinalExam)
    private readonly examRepository: Repository<FinalExam>,
    @InjectRepository(ExamQuestion)
    private readonly questionRepository: Repository<ExamQuestion>,
    @InjectRepository(ExamAttempt)
    private readonly attemptRepository: Repository<ExamAttempt>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    private readonly certificatesService: CertificatesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Check if a student is eligible to take the final exam
   * (must have completed all chapters in the course)
   */
  async checkEligibility(courseId: string, userId: string): Promise<{
    eligible: boolean;
    completedChapters: number;
    totalChapters: number;
    message?: string;
  }> {
    const totalChapters = await this.chapterRepository.count({
      where: { module: { courseId } },
    });

    if (totalChapters === 0) {
      return { eligible: true, completedChapters: 0, totalChapters: 0 };
    }

    const progress = await this.progressRepository.findOne({
      where: { courseId, userId },
    });

    const completedCount = progress?.completedChapterIds?.length || 0;
    const eligible = completedCount >= totalChapters;

    return {
      eligible,
      completedChapters: completedCount,
      totalChapters,
      message: eligible
        ? 'Eligible to take the Final Certification Exam.'
        : `You must complete all chapter tasks (${completedCount}/${totalChapters} completed) before attempting the final exam.`,
    };
  }

  /**
   * Seed default 10 comprehensive curriculum exam questions if none exist
   */
  async ensureExamExists(courseId: string): Promise<FinalExam> {
    let exam = await this.examRepository.findOne({
      where: { courseId },
      relations: ['questions'],
    });

    if (!exam) {
      const course = await this.courseRepository.findOne({ where: { id: courseId } });
      const courseTitle = course ? course.title : 'Software Engineering';

      exam = this.examRepository.create({
        courseId,
        title: `${courseTitle} - Final Certification Exam`,
        description:
          'Comprehensive final evaluation. Timed exam with strictly ONE attempt permitted. Score 60% or higher to earn your verified certificate.',
        timeLimitMinutes: 30,
        passingScorePercent: 60,
      });
      exam = await this.examRepository.save(exam);

      // Seed 10 professional curriculum questions
      const questionsData = [
        {
          question: 'What is the average time complexity of searching for an element by key in a Hash Map / Hash Table?',
          options: [
            { id: 'opt_1', text: 'O(1) Constant Time' },
            { id: 'opt_2', text: 'O(n) Linear Time' },
            { id: 'opt_3', text: 'O(log n) Logarithmic Time' },
            { id: 'opt_4', text: 'O(n^2) Quadratic Time' },
          ],
          correctOptionId: 'opt_1',
          points: 1,
          explanation: 'Hash tables offer O(1) average case lookup, insert, and delete operations via direct index mapping.',
          orderIndex: 0,
        },
        {
          question: 'In the Node.js event-driven runtime, which component handles non-blocking asynchronous I/O operations under the hood?',
          options: [
            { id: 'opt_1', text: 'V8 Garbage Collector' },
            { id: 'opt_2', text: 'libuv and the Worker Thread Pool' },
            { id: 'opt_3', text: 'Babel Transpiler' },
            { id: 'opt_4', text: 'React Fiber Reconciler' },
          ],
          correctOptionId: 'opt_2',
          points: 1,
          explanation: 'libuv is the multi-platform C library that provides the event loop and thread pool for asynchronous I/O in Node.js.',
          orderIndex: 1,
        },
        {
          question: 'Which HTTP method should be used for an API endpoint that updates an existing resource idempotently by replacing its state?',
          options: [
            { id: 'opt_1', text: 'POST' },
            { id: 'opt_2', text: 'PUT' },
            { id: 'opt_3', text: 'PATCH' },
            { id: 'opt_4', text: 'CONNECT' },
          ],
          correctOptionId: 'opt_2',
          points: 1,
          explanation: 'PUT is designed to be idempotent; executing it multiple times with the same payload produces the exact same resource state.',
          orderIndex: 2,
        },
        {
          question: 'What is the primary industry standard algorithm used to securely hash and salt user passwords before database persistence?',
          options: [
            { id: 'opt_1', text: 'MD5' },
            { id: 'opt_2', text: 'SHA-1' },
            { id: 'opt_3', text: 'bcrypt / Argon2' },
            { id: 'opt_4', text: 'Base64 Encoding' },
          ],
          correctOptionId: 'opt_3',
          points: 1,
          explanation: 'bcrypt and Argon2 utilize adaptive work factors (key stretching) and unique cryptographic salts to mitigate brute-force and rainbow table attacks.',
          orderIndex: 3,
        },
        {
          question: 'In relational database management systems (RDBMS), what does the "I" in the ACID guarantee represent?',
          options: [
            { id: 'opt_1', text: 'Integration' },
            { id: 'opt_2', text: 'Isolation' },
            { id: 'opt_3', text: 'Indexation' },
            { id: 'opt_4', text: 'Idempotency' },
          ],
          correctOptionId: 'opt_2',
          points: 1,
          explanation: 'Isolation ensures that concurrent transactions execute without interfering with one another, preventing dirty or uncommitted reads.',
          orderIndex: 4,
        },
        {
          question: 'How does React optimize UI updates using the Virtual DOM?',
          options: [
            { id: 'opt_1', text: 'By re-rendering the entire browser window on every state change' },
            { id: 'opt_2', text: 'By calculating the minimal diff between virtual trees and batch updating the real DOM (Reconciliation)' },
            { id: 'opt_3', text: 'By disabling garbage collection in the browser' },
            { id: 'opt_4', text: 'By compiling TypeScript code directly into WebAssembly at runtime' },
          ],
          correctOptionId: 'opt_2',
          points: 1,
          explanation: 'React maintains an in-memory Virtual DOM, computes structural diffs (reconciliation), and applies minimal mutations to the real browser DOM.',
          orderIndex: 5,
        },
        {
          question: 'Which of the following describes the purpose of Cross-Origin Resource Sharing (CORS)?',
          options: [
            { id: 'opt_1', text: 'An encryption protocol for WebSocket streams' },
            { id: 'opt_2', text: 'A browser security mechanism controlling access to resources on a different domain or port' },
            { id: 'opt_3', text: 'A database replication strategy between data centers' },
            { id: 'opt_4', text: 'A CSS preprocessor for responsive design' },
          ],
          correctOptionId: 'opt_2',
          points: 1,
          explanation: 'CORS is a browser security model utilizing HTTP headers to grant or deny web clients permission to consume resources from a differing origin.',
          orderIndex: 6,
        },
        {
          question: 'What is a closure in JavaScript / modern programming languages?',
          options: [
            { id: 'opt_1', text: 'A function bundled together with references to its surrounding lexical environment' },
            { id: 'opt_2', text: 'A syntax error when a curly bracket is left unclosed' },
            { id: 'opt_3', text: 'A mechanism to forcefully terminate a server process' },
            { id: 'opt_4', text: 'An automated database migration runner' },
          ],
          correctOptionId: 'opt_1',
          points: 1,
          explanation: 'A closure is created when an inner function retains access to variables declared in its outer enclosing scope even after the outer function has executed.',
          orderIndex: 7,
        },
        {
          question: 'In Git version control, what is the best practice for integrating changes from an approved feature branch into the main branch with full linear audit history?',
          options: [
            { id: 'opt_1', text: 'Delete the main branch and recreate it' },
            { id: 'opt_2', text: 'Merge commit or squash-and-merge via Pull Request with CI checks' },
            { id: 'opt_3', text: 'Force push without testing' },
            { id: 'opt_4', text: 'Copy-paste code files through the terminal' },
          ],
          correctOptionId: 'opt_2',
          points: 1,
          explanation: 'Merging via Pull Request with automated continuous integration checks ensures branch integrity and peer review traceability.',
          orderIndex: 8,
        },
        {
          question: 'Which of the following database structures is specifically created to dramatically accelerate SELECT query speed on specific columns at the expense of slight write overhead?',
          options: [
            { id: 'opt_1', text: 'Database View' },
            { id: 'opt_2', text: 'B-Tree Index' },
            { id: 'opt_3', text: 'Stored Procedure' },
            { id: 'opt_4', text: 'Foreign Key Constraint' },
          ],
          correctOptionId: 'opt_2',
          points: 1,
          explanation: 'Indexes (such as B-Tree indices) provide sorted lookup trees allowing logarithmic-time key lookups without full table scans.',
          orderIndex: 9,
        },
      ];

      for (const q of questionsData) {
        const questionEntity = this.questionRepository.create({
          examId: exam.id,
          question: q.question,
          options: q.options,
          correctOptionId: q.correctOptionId,
          points: q.points,
          explanation: q.explanation,
          orderIndex: q.orderIndex,
        });
        await this.questionRepository.save(questionEntity);
      }

      exam = await this.examRepository.findOne({
        where: { id: exam.id },
        relations: ['questions'],
      });
    }

    return exam!;
  }

  /**
   * Get Exam Overview, Student Eligibility & Previous Attempt Status
   */
  async getExamDetails(courseId: string, userId: string) {
    const eligibility = await this.checkEligibility(courseId, userId);
    const exam = await this.ensureExamExists(courseId);

    const existingAttempt = await this.attemptRepository.findOne({
      where: { examId: exam.id, userId },
      order: { createdAt: 'DESC' },
    });

    const existingCert = await this.certificatesService.findByUserAndCourse(
      userId,
      courseId,
    );

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        timeLimitMinutes: exam.timeLimitMinutes,
        passingScorePercent: exam.passingScorePercent,
        totalQuestions: exam.questions?.length || 10,
      },
      eligibility,
      attempt: existingAttempt
        ? {
            id: existingAttempt.id,
            status: existingAttempt.status,
            startedAt: existingAttempt.startedAt,
            submittedAt: existingAttempt.submittedAt,
            score: existingAttempt.score,
            totalQuestions: existingAttempt.totalQuestions,
            percentage: existingAttempt.percentage,
            passed: existingAttempt.passed,
            grade: existingAttempt.grade,
          }
        : null,
      certificate: existingCert
        ? {
            certificateId: existingCert.certificateId,
            fileUrl: existingCert.fileUrl,
            grade: existingCert.grade,
          }
        : null,
    };
  }

  /**
   * Start the final exam:
   * Enforces STRICT SINGLE ATTEMPT rule and generates sanitized questions
   */
  async startExam(courseId: string, userId: string) {
    const eligibility = await this.checkEligibility(courseId, userId);
    if (!eligibility.eligible) {
      throw new BadRequestException(
        eligibility.message ||
          'You must complete all chapter tasks before attempting the Final Certification Exam.',
      );
    }

    const exam = await this.ensureExamExists(courseId);

    const existingAttempt = await this.attemptRepository.findOne({
      where: { examId: exam.id, userId },
    });

    if (existingAttempt) {
      if (existingAttempt.status === ExamAttemptStatus.SUBMITTED) {
        throw new BadRequestException(
          'You have already completed your attempt for this Final Exam. Retakes are not permitted for official certification.',
        );
      }

      // Check if existing in-progress attempt has timed out
      const elapsedMs = Date.now() - new Date(existingAttempt.startedAt).getTime();
      const maxAllowedMs = (exam.timeLimitMinutes + 2) * 60 * 1000; // 2 min grace

      if (elapsedMs > maxAllowedMs) {
        existingAttempt.status = ExamAttemptStatus.TIMED_OUT;
        existingAttempt.passed = false;
        existingAttempt.grade = 'FAIL';
        await this.attemptRepository.save(existingAttempt);

        throw new BadRequestException(
          'Your exam attempt duration expired. Exam marked as TIMED OUT.',
        );
      }

      // Return ongoing attempt with questions
      const sanitizedQuestions = (exam.questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        points: q.points,
        orderIndex: q.orderIndex,
      }));

      return {
        attemptId: existingAttempt.id,
        startedAt: existingAttempt.startedAt,
        timeLimitMinutes: exam.timeLimitMinutes,
        questions: sanitizedQuestions,
        existingAnswers: existingAttempt.answers || {},
      };
    }

    // Create New Attempt
    const attempt = this.attemptRepository.create({
      examId: exam.id,
      userId,
      courseId,
      startedAt: new Date(),
      status: ExamAttemptStatus.IN_PROGRESS,
      totalQuestions: exam.questions?.length || 10,
    });
    const savedAttempt = await this.attemptRepository.save(attempt);

    // Sanitize questions (strip correctOptionId and explanation)
    const sanitizedQuestions = (exam.questions || []).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      points: q.points,
      orderIndex: q.orderIndex,
    }));

    return {
      attemptId: savedAttempt.id,
      startedAt: savedAttempt.startedAt,
      timeLimitMinutes: exam.timeLimitMinutes,
      questions: sanitizedQuestions,
      existingAnswers: {},
    };
  }

  /**
   * Submit exam answers, calculate grade, and issue certificate if passed
   */
  async submitExam(
    courseId: string,
    userId: string,
    answers: Record<string, string>,
  ) {
    const exam = await this.ensureExamExists(courseId);

    const attempt = await this.attemptRepository.findOne({
      where: { examId: exam.id, userId },
    });

    if (!attempt) {
      throw new NotFoundException('No active exam attempt found. Please start the exam first.');
    }

    if (attempt.status === ExamAttemptStatus.SUBMITTED) {
      throw new BadRequestException(
        'This exam attempt has already been submitted and graded.',
      );
    }

    // Grade answers
    const questions = await this.questionRepository.find({
      where: { examId: exam.id },
    });

    let correctCount = 0;
    const totalCount = questions.length;

    for (const q of questions) {
      const selectedOptionId = answers[q.id];
      if (selectedOptionId && selectedOptionId === q.correctOptionId) {
        correctCount += 1;
      }
    }

    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const passed = percentage >= exam.passingScorePercent;

    // Assign Grade
    let grade = 'FAIL';
    if (passed) {
      if (percentage >= 85) {
        grade = 'DISTINCTION';
      } else if (percentage >= 70) {
        grade = 'FIRST_CLASS';
      } else {
        grade = 'PASS';
      }
    }

    attempt.answers = answers;
    attempt.score = correctCount;
    attempt.totalQuestions = totalCount;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.grade = grade;
    attempt.status = ExamAttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();

    let certRecord: any = null;
    if (passed) {
      // Generate official verified course completion certificate with grade!
      certRecord = await this.certificatesService.generateCourseCertificate(
        userId,
        courseId,
        grade,
      );
      attempt.certificateId = certRecord.id;

      // Send congratulations notification
      await this.notificationsService.create(
        userId,
        '🎓 Final Exam Passed!',
        `Congratulations! You scored ${percentage}% (${grade.replace('_', ' ')}) on your Final Certification Exam. Your verified certificate is ready!`,
        NotificationType.COURSE,
        `/learn/${courseId}/completion`,
      );
    }

    await this.attemptRepository.save(attempt);

    return {
      passed,
      score: correctCount,
      totalQuestions: totalCount,
      percentage,
      grade,
      passingScorePercent: exam.passingScorePercent,
      certificate: certRecord
        ? {
            certificateId: certRecord.certificateId,
            fileUrl: certRecord.fileUrl,
            grade: certRecord.grade,
          }
        : null,
    };
  }
}
