import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudyCard } from './StudyCard';
import { multipleChoiceQuestion } from '../../fixtures/questions';

const meta: Meta<typeof StudyCard> = {
    title: 'Blocks/StudyCard',
    component: StudyCard,
};

export default meta;
type Story = StoryObj<typeof StudyCard>;

function InteractiveStudyCard(props: Omit<React.ComponentProps<typeof StudyCard>, 'revealed' | 'onReveal' | 'onGraded' | 'onRetry'>) {
    const [revealed, setRevealed] = useState(false);
    const [gradedCorrect, setGradedCorrect] = useState<boolean | null>(null);

    return (
        <StudyCard
            {...props}
            revealed={revealed}
            gradedCorrect={gradedCorrect}
            onReveal={() => setRevealed(true)}
            onGraded={setGradedCorrect}
            onRetry={() => {
                setRevealed(false);
                setGradedCorrect(null);
            }}
        />
    );
}

export const Active: Story = {
    render: (args) => <InteractiveStudyCard {...args} />,
    args: {
        card: { cardType: 'review', easeFactor: 2.5, interval: 14 },
        question: multipleChoiceQuestion,
        progress: { done: 2, total: 10 },
        ratingPreview: (r) => `${r * 3}d`,
        ratingDisabled: () => false,
        exitSlot: <span className="smallcaps underline">← Exit</span>,
        onRate: () => {},
        onBury: () => {},
        onSuspend: () => {},
        onIgnore: () => {},
    },
};
