import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task, TaskType } from '../../entities/task.entity';
import { Course } from '../../entities/course.entity';
import { TaskOption } from '../../entities/task-option.entity';
import { TestCase } from '../../entities/test-case.entity';
import { Chapter } from '../../entities/chapter.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskItemDto } from './dto/reorder-task.dto';
import { CourseStatus } from '../../entities/course.entity';
import { Submission, SubmissionStatus } from '../../entities/submission.entity';
import { CompilerService } from './compiler.service';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskOption)
    private taskOptionRepository: Repository<TaskOption>,
    @InjectRepository(TestCase)
    private testCaseRepository: Repository<TestCase>,
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    private readonly compilerService: CompilerService,
    private dataSource: DataSource,
  ) {}

  async create(
    chapterId: string,
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<Task> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['module', 'module.course'],
    });

    if (!chapter) throw new NotFoundException('Chapter not found');

    const course = chapter.module.course;
    if (course.mentorId !== userId)
      throw new ForbiddenException('Not authorized');

    const lockedStatuses = [
      CourseStatus.DRAFT_CURRICULUM,
      CourseStatus.CURRICULUM_UNDER_REVIEW,
      CourseStatus.CONTENT_UNDER_REVIEW,
      CourseStatus.PUBLISHED,
    ];

    if (lockedStatuses.includes(course.status)) {
      throw new BadRequestException(
        `Cannot add tasks while course is ${course.status.replace(/_/g, ' ')}.`,
      );
    }

    if (course.status === CourseStatus.CURRICULUM_APPROVED) {
      course.status = CourseStatus.CONTENT_DRAFT;
      await this.dataSource.getRepository(Course).save(course);
    }

    const lastTask = await this.taskRepository.findOne({
      where: { chapterId },
      order: { orderIndex: 'DESC' },
    });

    const newOrderIndex = (lastTask?.orderIndex || 0) + 1;

    const task = this.taskRepository.create({
      ...createTaskDto,
      chapterId,
      orderIndex: newOrderIndex,
    });

    return this.taskRepository.save(task);
  }

  async findAll(chapterId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { chapterId },
      relations: ['options', 'testCases'],
      order: { orderIndex: 'ASC' },
    });
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: [
        'chapter',
        'chapter.module',
        'chapter.module.course',
        'options',
        'testCases',
      ],
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.chapter.module.course.mentorId !== userId)
      throw new ForbiddenException('Not authorized');

    const course = task.chapter.module.course;
    const lockedStatuses = [
      CourseStatus.DRAFT_CURRICULUM,
      CourseStatus.CURRICULUM_UNDER_REVIEW,
      CourseStatus.CONTENT_UNDER_REVIEW,
      CourseStatus.PUBLISHED,
    ];

    if (lockedStatuses.includes(course.status)) {
      throw new BadRequestException(
        `Cannot edit tasks while course is ${course.status.replace(/_/g, ' ')}.`,
      );
    }

    if (course.status === CourseStatus.CURRICULUM_APPROVED) {
      course.status = CourseStatus.CONTENT_DRAFT;
      await this.dataSource.getRepository(Course).save(course);
    }

    // Handle nested updates manually if needed, or rely on cascade save if structured correctly.
    // For simplicity, we'll update the main task fields and recreate options/testCases if provided.

    const { options, testCases, ...taskData } = updateTaskDto;

    Object.assign(task, taskData);

    if (options && task.type === TaskType.MCQ) {
      // Replace existing options
      await this.taskOptionRepository.delete({ taskId: id });
      const newOptions = options.map((opt) =>
        this.taskOptionRepository.create({ ...opt, taskId: id }),
      );
      task.options = newOptions;
    }

    if (testCases && task.type === TaskType.CODING) {
      // Replace existing test cases
      await this.testCaseRepository.delete({ taskId: id });
      const newTestCases = testCases.map((tc) =>
        this.testCaseRepository.create({ ...tc, taskId: id }),
      );
      task.testCases = newTestCases;
    }

    return this.taskRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['chapter', 'chapter.module', 'chapter.module.course'],
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.chapter.module.course.mentorId !== userId)
      throw new ForbiddenException('Not authorized');

    const course = task.chapter.module.course;
    const lockedStatuses = [
      CourseStatus.DRAFT_CURRICULUM,
      CourseStatus.CURRICULUM_UNDER_REVIEW,
      CourseStatus.CONTENT_UNDER_REVIEW,
      CourseStatus.PUBLISHED,
    ];

    if (lockedStatuses.includes(course.status)) {
      throw new BadRequestException(
        `Cannot remove tasks while course is ${course.status.replace(/_/g, ' ')}.`,
      );
    }

    if (course.status === CourseStatus.CURRICULUM_APPROVED) {
      course.status = CourseStatus.CONTENT_DRAFT;
      await this.dataSource.getRepository(Course).save(course);
    }

    await this.taskRepository.delete(id);
  }

  async reorder(
    chapterId: string,
    items: ReorderTaskItemDto[],
    userId: string,
  ): Promise<void> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['module', 'module.course'],
    });

    if (!chapter) throw new NotFoundException('Chapter not found');
    if (chapter.module.course.mentorId !== userId)
      throw new ForbiddenException('Not authorized');

    const course = chapter.module.course;
    const lockedStatuses = [
      CourseStatus.DRAFT_CURRICULUM,
      CourseStatus.CURRICULUM_UNDER_REVIEW,
      CourseStatus.CONTENT_UNDER_REVIEW,
      CourseStatus.PUBLISHED,
    ];

    if (lockedStatuses.includes(course.status)) {
      throw new BadRequestException(
        `Cannot reorder tasks while course is ${course.status.replace(/_/g, ' ')}.`,
      );
    }

    if (course.status === CourseStatus.CURRICULUM_APPROVED) {
      course.status = CourseStatus.CONTENT_DRAFT;
      await this.dataSource.getRepository(Course).save(course);
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        await manager.update(
          Task,
          { id: item.id, chapterId },
          { orderIndex: item.order_index },
        );
      }
    });
  }

  // --- Student-Facing Interactive Task Execution & Progress ---

  async getStudentChapterTasks(chapterId: string, userId: string): Promise<any> {
    const tasks = await this.taskRepository.find({
      where: { chapterId },
      relations: ['options', 'testCases'],
      order: { orderIndex: 'ASC' },
    });

    const submissions = await this.submissionRepository.find({
      where: { chapterId, userId },
      order: { createdAt: 'DESC' },
    });

    // Map passed task IDs
    const passedTaskIds = new Set(
      submissions
        .filter((s) => s.status === SubmissionStatus.PASSED)
        .map((s) => s.taskId),
    );

    const sanitizedTasks = tasks.map((task) => {
      // Find latest submission for this task
      const latestSub = submissions.find((s) => s.taskId === task.id);

      // Sanitize MCQ options so isCorrect is never exposed to students
      const sanitizedOptions = (task.options || []).map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
      }));

      // Sanitize test cases: hide input & expected output if isHidden is true
      const sanitizedTestCases = (task.testCases || []).map((tc) => ({
        id: tc.id,
        input: tc.isHidden ? null : tc.input,
        expectedOutput: tc.isHidden ? null : tc.expectedOutput,
        isHidden: tc.isHidden,
      }));

      return {
        id: task.id,
        chapterId: task.chapterId,
        title: task.title,
        type: task.type,
        problemStatement: task.problemStatement,
        points: task.points,
        language: task.language,
        starterCode: task.starterCode,
        timeLimit: task.timeLimit,
        orderIndex: task.orderIndex,
        options: sanitizedOptions,
        testCases: sanitizedTestCases,
        isPassed: passedTaskIds.has(task.id),
        latestSubmission: latestSub
          ? {
              id: latestSub.id,
              status: latestSub.status,
              feedback: latestSub.feedback,
              output: latestSub.output,
              passedTests: latestSub.passedTests,
              totalTests: latestSub.totalTests,
              selectedOptionId: latestSub.selectedOptionId,
              createdAt: latestSub.createdAt,
            }
          : null,
      };
    });

    return {
      chapterId,
      tasks: sanitizedTasks,
      totalTasks: tasks.length,
      passedCount: passedTaskIds.size,
      allPassed: tasks.length === 0 || passedTaskIds.size >= tasks.length,
    };
  }

  async submitTask(
    chapterId: string,
    taskId: string,
    user: User,
    dto: SubmitTaskDto,
  ): Promise<any> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, chapterId },
      relations: [
        'options',
        'testCases',
        'chapter',
        'chapter.module',
        'chapter.module.course',
      ],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.type === TaskType.MCQ) {
      if (!dto.selectedOptionId) {
        throw new BadRequestException('Please select an option');
      }

      const selectedOption = (task.options || []).find(
        (o) => o.id === dto.selectedOptionId,
      );

      if (!selectedOption) {
        throw new BadRequestException('Selected option is invalid');
      }

      const isCorrect = selectedOption.isCorrect === true;
      const status = isCorrect
        ? SubmissionStatus.PASSED
        : SubmissionStatus.FAILED;
      const feedback = isCorrect
        ? '✓ Correct answer! Well done.'
        : '✗ Incorrect answer. Please review the material and try again.';

      const submission = this.submissionRepository.create({
        userId: user.id,
        chapterId,
        taskId,
        selectedOptionId: dto.selectedOptionId,
        status,
        feedback,
        pointsAwarded: isCorrect ? task.points : 0,
        passedTests: isCorrect ? 1 : 0,
        totalTests: 1,
      });

      const saved = await this.submissionRepository.save(submission);

      return {
        submissionId: saved.id,
        status,
        feedback,
        pointsAwarded: saved.pointsAwarded,
        isCorrect,
      };
    } else if (task.type === TaskType.CODING) {
      if (!dto.code || !dto.code.trim()) {
        throw new BadRequestException('Please provide code to run');
      }

      const evalResult = await this.compilerService.evaluateTestCases(
        task.language || 'python',
        dto.code,
        task.testCases || [],
        task.timeLimit || 2,
      );

      const status = evalResult.allPassed
        ? SubmissionStatus.PASSED
        : SubmissionStatus.FAILED;

      const feedback = evalResult.allPassed
        ? `✓ Excellent! All ${evalResult.totalTests} test cases passed.`
        : `✗ Test cases failed (${evalResult.passedTests}/${evalResult.totalTests} passed). Check your output and try again.`;

      const submission = this.submissionRepository.create({
        userId: user.id,
        chapterId,
        taskId,
        code: dto.code,
        status,
        feedback,
        output: evalResult.results
          .map(
            (r, idx) =>
              `Test #${idx + 1}: ${r.passed ? 'PASSED' : 'FAILED'}${r.error ? ` (${r.error})` : ''}`,
          )
          .join('\n'),
        passedTests: evalResult.passedTests,
        totalTests: evalResult.totalTests,
        pointsAwarded: evalResult.allPassed ? task.points : 0,
      });

      const saved = await this.submissionRepository.save(submission);

      return {
        submissionId: saved.id,
        status,
        feedback,
        pointsAwarded: saved.pointsAwarded,
        passedTests: evalResult.passedTests,
        totalTests: evalResult.totalTests,
        results: evalResult.results,
      };
    }

    throw new BadRequestException('Unsupported task type');
  }

  async getChapterTaskProgress(
    chapterId: string,
    userId: string,
  ): Promise<any> {
    const tasks = await this.taskRepository.find({
      where: { chapterId },
      select: ['id'],
    });

    if (tasks.length === 0) {
      return { totalTasks: 0, passedCount: 0, allPassed: true };
    }

    const passedSubmissions = await this.submissionRepository.find({
      where: { chapterId, userId, status: SubmissionStatus.PASSED },
      select: ['taskId'],
    });

    const passedTaskIds = new Set(passedSubmissions.map((s) => s.taskId));
    const allPassed = tasks.every((t) => passedTaskIds.has(t.id));

    return {
      totalTasks: tasks.length,
      passedCount: passedTaskIds.size,
      allPassed,
    };
  }
}
