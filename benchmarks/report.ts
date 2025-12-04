/**
 * Benchmark Report Generator
 * Runs benchmark suites and generates a clean Markdown report
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Suite {
    name: string;
    command: string;
    args: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = join(__dirname, 'reports');

const suites: Suite[] = [
    { name: 'Router', command: 'npm', args: ['run', 'bench:router'] },
    { name: 'Middleware', command: 'npm', args: ['run', 'bench:middleware'] },
    { name: 'Server', command: 'npm', args: ['run', 'bench:server'] },
    { name: 'Cache', command: 'npm', args: ['run', 'bench:cache'] },
    { name: 'Client', command: 'npm', args: ['run', 'bench:client'] },
    { name: 'End-to-End', command: 'npm', args: ['run', 'bench:e2e'] },
    { name: 'tRPC Comparison', command: 'npm', args: ['run', 'bench:trpc'] },
    { name: 'gRPC Comparison', command: 'npm', args: ['run', 'bench:grpc'] },
];

/**
 * Remove ANSI escape codes from text
 */
function stripAnsi(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Run a benchmark suite and capture output
 */
function runSuite({ command, args }: Suite): Promise<{ output: string; exitCode: number | null }> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: __dirname,
            shell: process.platform === 'win32',
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let output = '';

        child.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            output += text;
            process.stdout.write(text);
        });

        child.stderr.on('data', (chunk) => {
            const text = chunk.toString();
            output += text;
            process.stderr.write(text);
        });

        child.on('error', (error) => reject(error));
        child.on('close', (code) => resolve({ output, exitCode: code }));
    });
}

/**
 * Format timestamp for filename
 */
function formatTimestamp(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}-${hh}${min}${ss}`;
}

/**
 * Extract key metrics from benchmark output
 */
function extractMetrics(output: string): { summary: string; details: string } {
    const cleaned = stripAnsi(output);

    // Try to find the summary section
    const summaryMatch = cleaned.match(/📊 Summary:[\s\S]*?(?=\n\n|$)/);
    const summary = summaryMatch ? summaryMatch[0] : '';

    // Try to find performance targets
    const targetsMatch = cleaned.match(/🎯 Performance Targets:[\s\S]*?(?=\n\n|$)/);
    const targets = targetsMatch ? targetsMatch[0] : '';

    // Combine key sections
    const details = [summary, targets].filter(Boolean).join('\n\n');

    return {
        summary: summary || 'No summary available',
        details: details || cleaned.slice(0, 500) // Fallback to first 500 chars
    };
}

const now = new Date();
const timestamp = formatTimestamp(now);
const reportPath = join(reportsDir, `benchmark-report-${timestamp}.md`);

await mkdir(reportsDir, { recursive: true });

// Write report header
const header = `# SecureStack Benchmark Report

**Generated:** ${now.toISOString()}

This report contains performance metrics for all SecureStack benchmark suites.

---

`;

await writeFile(reportPath, header, 'utf8');

// Run each suite and collect results
const results: Array<{ name: string; success: boolean; metrics: string }> = [];

for (const suite of suites) {
    console.log(`\n🧪 Running ${suite.name} benchmarks...\n`);

    await appendFile(reportPath, `## ${suite.name}\n\n`, 'utf8');

    try {
        const { output, exitCode } = await runSuite(suite);
        const { details } = extractMetrics(output);

        if (exitCode === 0) {
            await appendFile(reportPath, `✅ **Status:** Passed\n\n`, 'utf8');
            await appendFile(reportPath, `### Results\n\n\`\`\`\n${details}\n\`\`\`\n\n`, 'utf8');
            results.push({ name: suite.name, success: true, metrics: details });
            console.log(`✅ ${suite.name} completed`);
        } else {
            const cleanOutput = stripAnsi(output);
            const errorMatch = cleanOutput.match(/(Error:.*?)(?:\n\s+at|$)/s);
            const errorMessage = errorMatch ? errorMatch[1].trim() : 'Unknown error';

            await appendFile(reportPath, `⚠️ **Status:** Failed (exit code ${exitCode})\n\n`, 'utf8');
            await appendFile(reportPath, `**Error:** ${errorMessage}\n\n`, 'utf8');
            await appendFile(reportPath, `<details>\n<summary>View full output</summary>\n\n\`\`\`\n${cleanOutput.slice(0, 2000)}\n\`\`\`\n</details>\n\n`, 'utf8');
            results.push({ name: suite.name, success: false, metrics: '' });
            console.warn(`⚠️ ${suite.name} failed with code ${exitCode}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await appendFile(reportPath, `❌ **Status:** Error\n\n> ${message}\n\n`, 'utf8');
        results.push({ name: suite.name, success: false, metrics: '' });
        console.error(`❌ Error in ${suite.name}:`, error);
    }

    await appendFile(reportPath, `---\n\n`, 'utf8');
}

// Add summary section
await appendFile(reportPath, `## Summary\n\n`, 'utf8');

const passed = results.filter(r => r.success).length;
const failed = results.length - passed;

await appendFile(reportPath, `- **Total Suites:** ${results.length}\n`, 'utf8');
await appendFile(reportPath, `- **Passed:** ${passed} ✅\n`, 'utf8');
await appendFile(reportPath, `- **Failed:** ${failed} ❌\n\n`, 'utf8');

if (passed > 0) {
    await appendFile(reportPath, `### Successful Benchmarks\n\n`, 'utf8');
    for (const result of results.filter(r => r.success)) {
        await appendFile(reportPath, `- ✅ ${result.name}\n`, 'utf8');
    }
    await appendFile(reportPath, `\n`, 'utf8');
}

if (failed > 0) {
    await appendFile(reportPath, `### Failed Benchmarks\n\n`, 'utf8');
    for (const result of results.filter(r => !r.success)) {
        await appendFile(reportPath, `- ❌ ${result.name}\n`, 'utf8');
    }
    await appendFile(reportPath, `\n`, 'utf8');
}

console.log(`\n📄 Report generated: ${reportPath}`);
console.log(`📊 Results: ${passed}/${results.length} passed\n`);
