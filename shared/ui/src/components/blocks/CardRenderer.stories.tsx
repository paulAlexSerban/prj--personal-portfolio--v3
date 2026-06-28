import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardRenderer } from './CardRenderer';

const meta: Meta<typeof CardRenderer> = {
    title: 'Blocks/CardRenderer',
    component: CardRenderer,
};

export default meta;
type Story = StoryObj<typeof CardRenderer>;

export const Markdown: Story = {
    args: {
        html: 'The **Review** renders *markdown* with `inline code` and lists:\n\n- First item\n- Second item',
        reveal: true,
    },
};

export const Math: Story = {
    args: {
        html: "Euler's identity: $e^{i\\pi} + 1 = 0$.\n\nDisplay:\n\n$$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$",
        reveal: true,
    },
};

export const Code: Story = {
    args: {
        html: '```typescript\nfunction greet(name: string) {\n  return `Hello, ${name}!`;\n}\n```',
        reveal: true,
    },
};

export const Inline: Story = {
    args: {
        html: 'Option with **bold** label',
        inline: true,
        reveal: true,
    },
};

export const Dropcap: Story = {
    args: {
        html: 'Once upon a time, in a land of spaced repetition, learners mastered their craft.',
        dropcap: true,
        reveal: true,
    },
};
