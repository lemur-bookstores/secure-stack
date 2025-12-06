import { describe, it, expect, vi } from 'vitest';
import { TimeoutManager } from '../TimeoutManager';

describe('TimeoutManager', () => {
    it('should complete action within timeout', async () => {
        const timeoutManager = new TimeoutManager({ timeout: 1000 });

        const action = vi.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'success';
        });

        const result = await timeoutManager.execute(action);
        expect(result).toBe('success');
        expect(action).toHaveBeenCalledTimes(1);
    });

    it('should throw timeout error when action exceeds timeout', async () => {
        const timeoutManager = new TimeoutManager({ timeout: 200 });

        const action = vi.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return 'success';
        });

        await expect(timeoutManager.execute(action)).rejects.toThrow('Operation timed out after 200ms');
    });

    it('should work with custom error message', async () => {
        const timeoutManager = new TimeoutManager({
            timeout: 100,
            errorMessage: 'Database query timeout'
        });

        const action = vi.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return 'success';
        });

        await expect(timeoutManager.execute(action)).rejects.toThrow('Database query timeout');
    });

    it('should propagate action errors', async () => {
        const timeoutManager = new TimeoutManager({ timeout: 1000 });

        const action = vi.fn(async () => {
            throw new Error('Action failed');
        });

        await expect(timeoutManager.execute(action)).rejects.toThrow('Action failed');
    });
});
