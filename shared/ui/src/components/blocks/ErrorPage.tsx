import { stampClasses } from '../ui/Stamp';

export interface ErrorPageProps {
    code?: string;
    title: string;
    message: string;
    homeHref: string;
    homeLabel?: string;
}

export function ErrorPage({ code, title, message, homeHref, homeLabel = 'Back home' }: ErrorPageProps) {
    return (
        <section className="py-16 text-center">
            {code && <p className="kicker text-sm">{code}</p>}
            <h1 className="font-display text-6xl font-bold">{title}</h1>
            <p className="deck mt-4 text-lg">{message}</p>
            <div className="rule-thin my-8" />
            <a href={homeHref} className={stampClasses('solid', 'md')}>
                {homeLabel}
            </a>
        </section>
    );
}
