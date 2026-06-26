import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildQuestionOptionRows,
    buildQuestionPayload,
    deriveGradingMode,
    parseQuestionFrontmatter,
} from './index.ts';

describe('parseQuestionFrontmatter', () => {
    it('defaults legacy frontmatter to free_text', () => {
        const result = parseQuestionFrontmatter({
            question: 'What is DFS?',
            status: 'published',
        });

        assert.equal(result.ok, true);
        if (!result.ok) return;

        assert.equal(result.data.answer_format, 'free_text');
        assert.equal(result.data.cognitive_style, 'factual_recall');
        assert.equal(result.data.difficulty, 'intermediate');
        assert.equal(deriveGradingMode(result.data.answer_format), 'self');
    });

    it('parses multiple_choice with options', () => {
        const result = parseQuestionFrontmatter({
            question: 'Pick one',
            status: 'published',
            answer_format: 'multiple_choice',
            cognitive_style: 'comprehension',
            options: [
                { key: 'a', label: 'A' },
                { key: 'b', label: 'B' },
            ],
            correct_option_keys: ['b'],
        });

        assert.equal(result.ok, true);
        if (!result.ok) return;

        assert.equal(deriveGradingMode(result.data.answer_format), 'auto');
        const options = buildQuestionOptionRows('post--abc', result.data);
        assert.equal(options.length, 2);
        assert.equal(options[1]?.is_correct, true);
    });

    it('parses true_false with boolean answer', () => {
        const result = parseQuestionFrontmatter({
            question: 'Graphs are always trees.',
            status: 'draft',
            answer_format: 'true_false',
            answer: false,
        });

        assert.equal(result.ok, true);
        if (!result.ok) return;

        const payload = JSON.parse(buildQuestionPayload(result.data) ?? '{}') as { answer: boolean };
        assert.equal(payload.answer, false);
    });

    it('rejects unknown correct_option_keys', () => {
        const result = parseQuestionFrontmatter({
            question: 'Pick one',
            status: 'published',
            answer_format: 'multiple_choice',
            options: [{ key: 'a', label: 'A' }],
            correct_option_keys: ['z'],
        });

        assert.equal(result.ok, false);
    });
});
