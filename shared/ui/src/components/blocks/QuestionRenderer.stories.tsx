import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuestionRenderer } from './QuestionRenderer';
import { freeTextQuestion, multipleChoiceQuestion, multipleSelectQuestion, trueFalseQuestion } from '../../fixtures/questions';

const meta: Meta<typeof QuestionRenderer> = {
    title: 'Blocks/QuestionRenderer',
    component: QuestionRenderer,
};

export default meta;
type Story = StoryObj<typeof QuestionRenderer>;

function InteractiveQuestion(props: React.ComponentProps<typeof QuestionRenderer>) {
    const [revealed, setRevealed] = useState(props.revealed ?? false);
    return <QuestionRenderer {...props} revealed={revealed} onReveal={() => setRevealed(true)} onRetry={() => setRevealed(false)} />;
}

export const FreeText: Story = {
    render: (args) => <InteractiveQuestion {...args} />,
    args: { question: freeTextQuestion },
};

export const MultipleChoice: Story = {
    render: (args) => <InteractiveQuestion {...args} />,
    args: { question: multipleChoiceQuestion },
};

export const TrueFalse: Story = {
    render: (args) => <InteractiveQuestion {...args} />,
    args: { question: trueFalseQuestion },
};

export const MultipleSelect: Story = {
    render: (args) => <InteractiveQuestion {...args} />,
    args: { question: multipleSelectQuestion },
};

export const Revealed: Story = {
    args: {
        question: multipleChoiceQuestion,
        revealed: true,
        onReveal: () => {},
    },
};
