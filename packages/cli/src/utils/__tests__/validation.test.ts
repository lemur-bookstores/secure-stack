import { describe, it, expect } from 'vitest';
import { Validation } from '../validation.js';

describe('Validation', () => {
    describe('projectName', () => {
        it('should validate correct project names', () => {
            expect(Validation.projectName('my-project').valid).toBe(true);
            expect(Validation.projectName('project123').valid).toBe(true);
        });

        it('should reject invalid project names', () => {
            expect(Validation.projectName('My Project').valid).toBe(false);
            expect(Validation.projectName('project/name').valid).toBe(false);
            expect(Validation.projectName('-start-dash').valid).toBe(false);
            expect(Validation.projectName('end-dash-').valid).toBe(false);
            expect(Validation.projectName('my_project').valid).toBe(false); // Underscores not allowed
        });
    });

    describe('componentName', () => {
        it('should validate correct component names', () => {
            expect(Validation.componentName('UserService').valid).toBe(true);
            expect(Validation.componentName('user-service').valid).toBe(true);
            expect(Validation.componentName('auth').valid).toBe(true);
        });

        it('should reject invalid component names', () => {
            expect(Validation.componentName('123service').valid).toBe(false);
            expect(Validation.componentName('service!').valid).toBe(false);
        });
    });
});
