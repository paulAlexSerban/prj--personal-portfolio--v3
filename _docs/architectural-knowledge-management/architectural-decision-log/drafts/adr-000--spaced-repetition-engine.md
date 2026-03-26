### 9.1 Public API

```typescript
// packages/sr-engine/src/sm2.ts

export type Rating = 1 | 2 | 3 | 4;  // Again=1, Hard=2, Good=3, Easy=4

export interface CardState {
  questionSlug: string;
  easeFactor:   number;   // min 1.3, default 2.5
  interval:     number;   // days until next review
  repetitions:  number;   // consecutive correct reviews
  dueDate:      string;   // ISO 8601 date 'YYYY-MM-DD'
  ignored:      boolean;
}

/** Returns a new CardState — never mutates input */
export function reviewCard(state: CardState, rating: Rating): CardState;

/** True if card.dueDate <= today */
export function isDue(state: CardState): boolean;

/** Creates a default CardState for a new (unseen) card */
export function getNewCard(questionSlug: string): CardState;
```

### 9.2 SM-2 Algorithm Implementation

```typescript
export function reviewCard(state: CardState, rating: Rating): CardState {
  const s = { ...state };   // immutable — never mutate input

  if (rating === 1) {        // Again
    s.repetitions = 0;
    s.interval    = 0;       // re-queue within same session
  } else {
    if (s.repetitions === 0)      s.interval = 1;
    else if (s.repetitions === 1) s.interval = 6;
    else                          s.interval = Math.round(s.interval * s.easeFactor);

    s.repetitions += 1;
  }

  // Ease factor adjustment (matches Anki formula)
  s.easeFactor = Math.max(
    1.3,
    s.easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02))
  );

  s.dueDate = addDays(today(), s.interval);
  return s;
}
```

### 9.3 Testing Requirements

- ≥ 95% line coverage
- Reference test cases must match known Anki SM-2 output for ratings 1–4 across at least 10 simulated review cycles
- `reviewCard` must never mutate its input — tested with `Object.freeze`

---