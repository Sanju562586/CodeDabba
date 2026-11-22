import { Injectable, Logger } from '@nestjs/common';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  durationMs?: number;
  error?: string;
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  input?: string | null;
  expectedOutput?: string | null;
  actualOutput?: string;
  error?: string;
  isHidden: boolean;
}

@Injectable()
export class CompilerService {
  private readonly logger = new Logger(CompilerService.name);
  private readonly pistonApiUrl = 'https://emkc.org/api/v2/piston/execute';

  // Language mapping for Piston
  private readonly languageMap: Record<string, string> = {
    python: 'python',
    py: 'python',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    cpp: 'cpp',
    c: 'c',
    java: 'java',
    golang: 'go',
    go: 'go',
  };

  /**
   * Execute code with given stdin input using Piston external compiler API
   */
  async executeCode(
    language: string,
    code: string,
    stdin: string = '',
    timeLimitSeconds: number = 2,
  ): Promise<ExecutionResult> {
    const lang = this.languageMap[language.toLowerCase()] || language.toLowerCase();
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutMs = Math.min(Math.max(timeLimitSeconds * 1000, 1000), 10000);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs + 2000);

      const response = await fetch(this.pistonApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang,
          version: '*',
          files: [{ content: code }],
          stdin: stdin,
          run_timeout: timeoutMs,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Piston API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      const run = data.run || {};
      const durationMs = Date.now() - startTime;

      return {
        stdout: (run.stdout || '').trim(),
        stderr: (run.stderr || '').trim(),
        output: (run.output || '').trim(),
        exitCode: run.code ?? 0,
        durationMs,
      };
    } catch (err: any) {
      this.logger.warn(`Piston execution failed: ${err.message}. Attempting fallback execution.`);
      return this.fallbackExecution(language, code, stdin, startTime);
    }
  }

  /**
   * Lightweight in-memory fallback for JavaScript / Python if external service is unreachable
   */
  private fallbackExecution(
    language: string,
    code: string,
    stdin: string,
    startTime: number,
  ): ExecutionResult {
    const lang = (this.languageMap[language.toLowerCase()] || language).toLowerCase();
    const durationMs = Date.now() - startTime;

    if (lang === 'javascript') {
      try {
        let capturedStdout = '';
        const customConsole = {
          log: (...args: any[]) => {
            capturedStdout += args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
          },
          error: (...args: any[]) => {
            capturedStdout += args.join(' ') + '\n';
          },
        };

        // Run in restricted function scope
        const runFn = new Function('console', 'input', code);
        runFn(customConsole, stdin);

        return {
          stdout: capturedStdout.trim(),
          stderr: '',
          output: capturedStdout.trim(),
          exitCode: 0,
          durationMs,
        };
      } catch (e: any) {
        return {
          stdout: '',
          stderr: e.message || String(e),
          output: e.message || String(e),
          exitCode: 1,
          durationMs,
        };
      }
    }

    return {
      stdout: '',
      stderr: 'External compiler is currently unreachable. Please check your network connection.',
      output: 'Compiler unreachable',
      exitCode: 1,
      durationMs,
      error: 'Compiler unreachable',
    };
  }

  /**
   * Run code across all test cases for a task and return evaluation results
   */
  async evaluateTestCases(
    language: string,
    code: string,
    testCases: Array<{ id: string; input: string; expectedOutput: string; isHidden: boolean }>,
    timeLimitSeconds: number = 2,
  ): Promise<{
    allPassed: boolean;
    passedTests: number;
    totalTests: number;
    results: TestCaseResult[];
  }> {
    if (!testCases || testCases.length === 0) {
      // If no test cases configured, run code once to ensure no syntax/runtime errors
      const exec = await this.executeCode(language, code, '', timeLimitSeconds);
      const passed = exec.exitCode === 0;
      return {
        allPassed: passed,
        passedTests: passed ? 1 : 0,
        totalTests: 1,
        results: [
          {
            testCaseId: 'default',
            passed,
            actualOutput: exec.output,
            error: exec.stderr || undefined,
            isHidden: false,
          },
        ],
      };
    }

    const results: TestCaseResult[] = [];
    let passedCount = 0;

    for (const tc of testCases) {
      const exec = await this.executeCode(language, code, tc.input || '', timeLimitSeconds);
      const actual = (exec.stdout || '').trim();
      const expected = (tc.expectedOutput || '').trim();
      const passed = exec.exitCode === 0 && actual === expected;

      if (passed) passedCount++;

      results.push({
        testCaseId: tc.id,
        passed,
        input: tc.isHidden ? null : tc.input,
        expectedOutput: tc.isHidden ? null : tc.expectedOutput,
        actualOutput: tc.isHidden && !passed ? 'Hidden' : actual,
        error: exec.stderr ? exec.stderr : undefined,
        isHidden: tc.isHidden,
      });
    }

    return {
      allPassed: passedCount === testCases.length,
      passedTests: passedCount,
      totalTests: testCases.length,
      results,
    };
  }
}
