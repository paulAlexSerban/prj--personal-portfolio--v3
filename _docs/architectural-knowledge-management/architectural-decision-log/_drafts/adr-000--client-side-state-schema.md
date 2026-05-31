### 10.1 TypeScript Interfaces

```typescript
// packages/storage/src/interface.ts

export interface UserStats {
  version:          number;                            // schema version for migrations
  cardStates:       Record<string, CardState>;         // keyed by questionSlug
  studySets:        StudySetEntry[];
  ignoredQuestions: string[];                          // questionSlug[]
}

export interface StudySetEntry {
  postSlug: string;
  addedAt:  string;  // ISO 8601 datetime
}
```

### 10.2 Storage Adapter Interface

```typescript
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// Web implementation
export class LocalStorageAdapter implements StorageAdapter { ... }

// Mobile implementation (Capacitor)
export class CapacitorStorageAdapter implements StorageAdapter { ... }
```

### 10.3 Schema Versioning

The `version` field enables forward-compatible migrations:

```typescript
const CURRENT_VERSION = 1;

function migrate(raw: Partial<UserStats>): UserStats {
  const v = raw.version ?? 0;
  if (v < 1) { /* v0 → v1 migration */ }
  return { ...defaults, ...raw, version: CURRENT_VERSION };
}
```

### 10.4 Key Invariants

- Removing a post from `studySets` MUST NOT remove its entries from `cardStates`.
- `ignoredQuestions` is a soft-exclude list — `CardState` records are retained.
- All writes are atomic per card state update; a failed write must not leave the deck in a partially updated state.

---