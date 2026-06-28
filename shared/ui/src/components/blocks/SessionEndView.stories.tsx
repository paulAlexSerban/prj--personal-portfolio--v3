import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SessionEndView } from './SessionEndView';
import { Stamp } from '../ui/Stamp';

const meta: Meta<typeof SessionEndView> = {
    title: 'Blocks/SessionEndView',
    component: SessionEndView,
};

export default meta;
type Story = StoryObj<typeof SessionEndView>;

export const Default: Story = {
    args: {
        stats: { again: 2, hard: 5, good: 18, easy: 3, totalTime: 420000 },
        subtitle: "You have reached the end of today's queue.",
        actions: (
            <>
                <Stamp variant="solid">Study More</Stamp>
                <Stamp variant="ghost">Back to Sets</Stamp>
            </>
        ),
    },
};
