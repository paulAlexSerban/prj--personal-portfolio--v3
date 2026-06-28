import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stamp } from './Stamp';

const meta: Meta<typeof Stamp> = {
    title: 'UI/Stamp',
    component: Stamp,
    args: {
        children: 'Study Now',
    },
};

export default meta;
type Story = StoryObj<typeof Stamp>;

export const Solid: Story = { args: { variant: 'solid' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Large: Story = { args: { variant: 'solid', size: 'lg' } };
export const Disabled: Story = { args: { variant: 'solid', disabled: true } };
