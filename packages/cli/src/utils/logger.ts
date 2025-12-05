import picocolors from 'picocolors';
import ora, { Ora } from 'ora';

export class Logger {
    private spinner: Ora | null = null;

    info(message: string): void {
        console.log(picocolors.blue('ℹ'), message);
    }

    success(message: string): void {
        console.log(picocolors.green('✔'), message);
    }

    warn(message: string): void {
        console.log(picocolors.yellow('⚠'), message);
    }

    error(message: string): void {
        console.log(picocolors.red('✖'), message);
    }

    startSpinner(message: string): void {
        this.spinner = ora(message).start();
    }

    succeedSpinner(message?: string): void {
        if (this.spinner) {
            this.spinner.succeed(message);
            this.spinner = null;
        }
    }

    failSpinner(message?: string): void {
        if (this.spinner) {
            this.spinner.fail(message);
            this.spinner = null;
        }
    }

    log(message: string): void {
        console.log(message);
    }

    newLine(): void {
        console.log();
    }

    box(message: string, title?: string): void {
        const lines = message.split('\n');
        const maxLength = Math.max(...lines.map(l => l.length));
        const border = '─'.repeat(maxLength + 4);

        console.log();
        console.log(picocolors.cyan(`┌${border}┐`));

        if (title) {
            const padding = ' '.repeat(Math.floor((maxLength - title.length) / 2) + 2);
            console.log(picocolors.cyan('│') + padding + picocolors.bold(title) + padding + picocolors.cyan('│'));
            console.log(picocolors.cyan(`├${border}┤`));
        }

        lines.forEach(line => {
            const padding = ' '.repeat(maxLength - line.length);
            console.log(picocolors.cyan('│') + '  ' + line + padding + '  ' + picocolors.cyan('│'));
        });

        console.log(picocolors.cyan(`└${border}┘`));
        console.log();
    }
}

export const logger = new Logger();
