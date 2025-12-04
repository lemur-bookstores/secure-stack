/**
 * Benchmark Report Generator
 * Runs benchmark suites and saves their console output into a Markdown file
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

function formatTimestamp(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}-${hh}${min}${ss}`;
}

const now = new Date();
const timestamp = formatTimestamp(now);
const reportPath = join(reportsDir, `benchmark-report-${timestamp}.md`);

await mkdir(reportsDir, { recursive: true });

const header = `# SecureStack Benchmark Report\n\n` +
    `Generated on ${now.toISOString()}\n\n` +
    `This report captures the console output for each benchmark suite.\n\n`;

await writeFile(reportPath, header, 'utf8');

for (const suite of suites) {
    console.log(`\n🧪 Running ${suite.name} benchmarks...\n`);
    await appendFile(reportPath, `## ${suite.name}\n\n`, 'utf8');

    try {
        const { output, exitCode } = await runSuite(suite);
        const trimmed = output.trim() || '(sin salida)';

        await appendFile(reportPath, '````bash\n' + trimmed + '\n````\n\n', 'utf8');

        if (exitCode !== 0) {
            await appendFile(reportPath, `> ⚠️ Comando finalizó con código ${exitCode}\n\n`, 'utf8');
            console.warn(`⚠️ ${suite.name} terminó con código ${exitCode}`);
        } else {
            console.log(`✅ ${suite.name} completado`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await appendFile(reportPath, `> ❌ Error ejecutando benchmark: ${message}\n\n`, 'utf8');
        console.error(`❌ Error en ${suite.name}:`, error);
    }
}

console.log(`\n📄 Reporte generado en: ${reportPath}`);
