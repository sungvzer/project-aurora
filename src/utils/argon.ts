import argon from 'argon2';

const argonOptions = { hashLength: 32, memoryCost: 5000, parallelism: 12, timeCost: 50, type: argon.argon2i, saltLength: 32, };

export async function hashPassword(password: string): Promise<string> {
    return argon.hash(password, argonOptions);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return argon.verify(hash, password);
}

