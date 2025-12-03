import bcrypt from 'bcryptjs';

export class PasswordManager {
    private readonly saltRounds: number;

    constructor(saltRounds: number = 10) {
        this.saltRounds = saltRounds;
    }

    /**
     * Hashes a password
     */
    public async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Verifies a password against a hash
     */
    public async verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
