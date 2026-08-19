import { useEffect, useState } from 'react';

import { Modal } from '@prj--personal-portfolio--v3/shared--ui/modal';

import { NEWS_INTRO_DISMISSED_KEY, NEWS_INTRO_OPEN_EVENT } from '@/library/modules/newsIntro.ts';

function readDismissed(): boolean {
    try {
        return localStorage.getItem(NEWS_INTRO_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

function writeDismissed(): void {
    try {
        localStorage.setItem(NEWS_INTRO_DISMISSED_KEY, '1');
    } catch {
        // Private mode / blocked storage — still close the modal.
    }
}

export function NewsIntroModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!readDismissed()) setOpen(true);
        const onOpen = () => setOpen(true);
        window.addEventListener(NEWS_INTRO_OPEN_EVENT, onOpen);
        return () => window.removeEventListener(NEWS_INTRO_OPEN_EVENT, onOpen);
    }, []);

    const dismiss = () => {
        writeDismissed();
        setOpen(false);
    };

    return (
        <Modal open={open} onClose={dismiss} title="About this digest">
            <p className="deck m-0 text-sm">
                Engineering Wire is a personal RSS aggregation I built so I can scrape and skim software-engineering headlines in one place. Feeds are fetched daily. Each card
                links out to the original publisher — I do not write these articles, host their content, or speak for those sites.
            </p>
            <button type="button" className="stamp mt-5 appearance-none px-4 py-2 text-sm" onClick={dismiss}>
                Read the feed
            </button>
        </Modal>
    );
}
