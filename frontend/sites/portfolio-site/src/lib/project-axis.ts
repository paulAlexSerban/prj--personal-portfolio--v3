export type AxisKind = 'scope' | 'maturity';

export const SCOPE_IDS = ['component', 'service', 'system'] as const;
export const MATURITY_IDS = ['concept', 'prototype', 'implemented', 'production-grade'] as const;

export type ScopeId = (typeof SCOPE_IDS)[number];
export type MaturityId = (typeof MATURITY_IDS)[number];
export type AxisTermId = ScopeId | MaturityId;

export interface AxisTerm {
    id: AxisTermId;
    axis: AxisKind;
    label: string;
    lead: string;
    body: string;
    contrast: string;
}

export const AXIS_TERMS: Record<AxisTermId, AxisTerm> = {
    component: {
        id: 'component',
        axis: 'scope',
        label: 'Component',
        lead: 'One class, module, or pattern.',
        body: 'Readable in one sitting. Isolates a single architectural decision (cache decorator, rate limiter, circuit breaker). A DB or one demo endpoint is a harness, not a product.',
        contrast:
            'Not a Service: a Service has a real request path with its own deploy story. A Component is one sitting, one decision.',
    },
    service: {
        id: 'service',
        axis: 'scope',
        label: 'Service',
        lead: 'One running app, end to end.',
        body: 'Own entry point, config, and request path. Neighbors on the same process still count as one service. A database is a dependency, not a second service.',
        contrast:
            'Not a System: the point of a System is the interaction between services. Not a Component: the moment you have a real request path and deploy story, you are past "readable in one sitting."',
    },
    system: {
        id: 'system',
        axis: 'scope',
        label: 'System',
        lead: 'Multiple services plus infra.',
        body: 'The point is what happens between them: scaling, failure, consistency, orchestration. Feature count or Docker Compose service count does not earn this on its own.',
        contrast:
            'Not a Service: one deployable with dependencies is still a Service. System is earned when the interaction across services is the point of the entry.',
    },
    concept: {
        id: 'concept',
        axis: 'maturity',
        label: 'Concept',
        lead: 'Problem and proposed solution - no code yet.',
        body: 'Named situation, constraints, and an ADR-shaped decision. Legitimate at any scope, including System.',
        contrast:
            'Not a Prototype: any code that exercises the core mechanism - even a spike - is already Prototype. Concept is written, not built.',
    },
    prototype: {
        id: 'prototype',
        axis: 'maturity',
        label: 'Prototype',
        lead: 'The key mechanism works in code; the rest is incomplete.',
        body: 'Runnable locally, even if setup is manual. Surrounding pieces may be stubbed or unpolished.',
        contrast:
            'Not Implemented: the core trick works, but the claimed scope is not complete. Implemented means feature-complete, documented, and reliably runnable.',
    },
    implemented: {
        id: 'implemented',
        axis: 'maturity',
        label: 'Implemented',
        lead: 'Feature-complete for the scope it claims.',
        body: 'Documented and reliably runnable. It does the job. It has not been proven under load.',
        contrast:
            'Not Production-grade: telemetry or a demo is not a load test. Production-grade needs explicit SLOs and measured results.',
    },
    'production-grade': {
        id: 'production-grade',
        axis: 'maturity',
        label: 'Production-grade',
        lead: 'Load-tested against stated SLOs.',
        body: 'Numbers in the write-up, not intuition or a dashboard screenshot. Reproducible methodology. Ceiling of the maturity axis.',
        contrast:
            'Implemented does the job; this one has numbers. Promoting scope (Component to Service, Service to System) usually resets this - the new surrounding infra has not been measured yet.',
    },
};

const AXIS_HINT: Record<MaturityId, (scopeNoun: string) => string> = {
    concept: (scopeNoun) => `Design for a ${scopeNoun} - written, not built`,
    prototype: (scopeNoun) => `Partial ${scopeNoun} - core mechanism proven in code`,
    implemented: (scopeNoun) => `Full working ${scopeNoun} - not yet load-tested`,
    'production-grade': (scopeNoun) => `Load-tested ${scopeNoun} - measured against stated SLOs`,
};

export function formatAxisLabel(value: string): string {
    return value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-');
}

export function getAxisTerm(id: string): AxisTerm | undefined {
    return AXIS_TERMS[id as AxisTermId];
}

export function getAxisTerms(axis: AxisKind): AxisTerm[] {
    const ids = axis === 'scope' ? SCOPE_IDS : MATURITY_IDS;
    return ids.map((id) => AXIS_TERMS[id]);
}

export function isMaturityId(value: string): value is MaturityId {
    return (MATURITY_IDS as readonly string[]).includes(value);
}

export function projectAxisHint(scope: string, maturity: string): string {
    const scopeNoun = getAxisTerm(scope)?.label.toLowerCase() ?? scope;
    if (!isMaturityId(maturity)) {
        return `${formatAxisLabel(scope)} · ${formatAxisLabel(maturity)}`;
    }
    return AXIS_HINT[maturity](scopeNoun);
}
