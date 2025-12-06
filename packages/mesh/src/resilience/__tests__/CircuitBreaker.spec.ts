import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;
    let successAction: () => Promise<string>;
    let failAction: () => Promise<string>;

    beforeEach(() => {
        circuitBreaker = new CircuitBreaker({
            failureThreshold: 3,
            successThreshold: 2,
            timeout: 1000,
        });

        successAction = vi.fn(async () => 'success');
        failAction = vi.fn(async () => {
            throw new Error('Service unavailable');
        });
    });

    it('should execute action when circuit is closed', async () => {
        const result = await circuitBreaker.execute(successAction);
        expect(result).toBe('success');
        expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should open circuit after failure threshold', async () => {
        for (let i = 0; i < 3; i++) {
            try {
                await circuitBreaker.execute(failAction);
            } catch (e) {
                // Expected
            }
        }

        expect(circuitBreaker.getState()).toBe('open');
    });

    it('should reject requests when circuit is open', async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
            try {
                await circuitBreaker.execute(failAction);
            } catch (e) {
                // Expected
            }
        }

        await expect(circuitBreaker.execute(successAction)).rejects.toThrow(
            'Circuit breaker is open'
        );
    });

    it('should transition to half-open after timeout', async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
            try {
                await circuitBreaker.execute(failAction);
            } catch (e) {
                // Expected
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1100));

        // The state will be half-open when we attempt the next call
        const initialState = circuitBreaker.getState();
        expect(initialState).toBe('open');

        // After timeout, next call should be allowed (transitions to half-open)
        const result = await circuitBreaker.execute(successAction);
        expect(result).toBe('success');
    });

    it('should close circuit on successful half-open requests', async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
            try {
                await circuitBreaker.execute(failAction);
            } catch (e) {
                // Expected
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1100));

        // Need 2 successful requests (successThreshold)
        await circuitBreaker.execute(successAction);
        await circuitBreaker.execute(successAction);

        expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should reopen circuit on failed half-open request', async () => {
        // Open circuit
        for (let i = 0; i < 3; i++) {
            try {
                await circuitBreaker.execute(failAction);
            } catch (e) {
                // Expected
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1100));

        try {
            await circuitBreaker.execute(failAction);
        } catch (e) {
            // Expected
        }

        expect(circuitBreaker.getState()).toBe('open');
    });
});
