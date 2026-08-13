import { NEWS_INTRO_OPEN_EVENT } from '@/library/modules/newsIntro.ts';

interface Props {
    className?: string;
}

export function NewsIntroTrigger({ className }: Props) {
    return (
        <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(NEWS_INTRO_OPEN_EVENT))}>
            About this digest
        </button>
    );
}
