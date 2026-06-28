import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { NothingDueView } from './NothingDueView';
import { Stamp } from '../ui/Stamp';

const meta: Meta<typeof NothingDueView> = {
    title: 'Blocks/NothingDueView',
    component: NothingDueView,
};

export default meta;
type Story = StoryObj<typeof NothingDueView>;

export const Empty: Story = {
    args: {
        counts: { newTotal: 0, learningDue: 0, reviewDue: 0 },
        actions: <Stamp variant="ghost">Back to Sets</Stamp>,
    },
};

export const CappedByLimit: Story = {
    args: {
        counts: { newTotal: 12, learningDue: 3, reviewDue: 8 },
        onStudyAhead: () => {},
        actions: <Stamp variant="ghost">Back to Sets</Stamp>,
    },
};
