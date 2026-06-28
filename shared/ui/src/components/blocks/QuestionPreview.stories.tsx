import React from 'react';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuestionPreview } from './QuestionPreview';
import { Stamp, stampClasses } from '../ui/Stamp';
import { multipleChoiceQuestion } from '../../fixtures/questions';

const meta: Meta<typeof QuestionPreview> = {
    title: 'Blocks/QuestionPreview',
    component: QuestionPreview,
};

export default meta;
type Story = StoryObj<typeof QuestionPreview>;

function InteractivePreview(props: Omit<React.ComponentProps<typeof QuestionPreview>, 'open' | 'onClose'>) {
    const [open, setOpen] = useState(true);
    return (
        <>
            <Stamp onClick={() => setOpen(true)}>Open Preview</Stamp>
            <QuestionPreview {...props} open={open} onClose={() => setOpen(false)} />
        </>
    );
}

export const Default: Story = {
    render: (args) => <InteractivePreview {...args} />,
    args: {
        question: multipleChoiceQuestion,
        stateLabel: 'Review due',
        isIgnored: false,
        isSuspended: false,
        card: { interval: 14, easeFactor: 2.5, dueDate: '2026-06-28', lapses: 0 },
        studyAction: (
            <button type="button" className={stampClasses('solid', 'md')}>
                Study This Card
            </button>
        ),
        onIgnoreToggle: () => {},
        onSuspendToggle: () => {},
        onReset: () => {},
        renderTag: (tag) => (
            <span key={tag} className="text-[14px] border border-[var(--ink-black)] px-2 py-0.5">
                {tag}
            </span>
        ),
    },
};

export const IgnoredAndSuspended: Story = {
    render: (args) => <InteractivePreview {...args} />,
    args: {
        question: multipleChoiceQuestion,
        stateLabel: 'Ignored',
        isIgnored: true,
        isSuspended: true,
        studyAction: (
            <button type="button" className={stampClasses('solid', 'md')}>
                Study This Card
            </button>
        ),
        onIgnoreToggle: () => {},
        onSuspendToggle: () => {},
        onReset: () => {},
    },
};
