import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type StampVariant = 'solid' | 'ghost';
export type StampSize = 'sm' | 'md' | 'lg';

export function stampClasses(variant: StampVariant = 'solid', size: StampSize = 'md', extra = '') {
    const variantCls = variant === 'ghost' ? 'stamp stamp-ghost' : 'stamp';
    const sizeCls = size === 'sm' ? 'text-sm px-3 py-1.5' : size === 'lg' ? 'text-lg px-6 py-3' : 'md:text-base text-sm';
    return `${variantCls} ${sizeCls} ${extra}`.trim();
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: StampVariant;
    size?: StampSize;
}

export const Stamp = forwardRef<HTMLButtonElement, Props>(function Stamp({ variant = 'solid', size = 'md', className = '', children, type = 'button', ...rest }, ref) {
    return (
        <button ref={ref} type={type} className={stampClasses(variant, size, className)} {...rest}>
            {children}
        </button>
    );
});
