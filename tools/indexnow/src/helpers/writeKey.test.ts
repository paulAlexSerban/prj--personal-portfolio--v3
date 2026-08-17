import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeKeyFile } from './writeKey.ts';
import { validateKey } from './key.ts';

const key = 'abcd1234efgh5678';
let distDir = '';

beforeEach(async () => {
    distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'indexnow-key-'));
});

afterEach(async () => {
    if (distDir) {
        await fs.rm(distDir, { recursive: true, force: true });
    }
});

describe('writeKeyFile', () => {
    it('writes the key with no extra characters', async () => {
        const filePath = await writeKeyFile(distDir, validateKey(key));
        expect(path.basename(filePath)).toBe(`${key}.txt`);
        expect(await fs.readFile(filePath, 'utf8')).toBe(key);
    });
});
