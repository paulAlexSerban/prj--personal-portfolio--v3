| **CMS**               | Directus            | Open-source; SQLite adapter; self-hostable; no vendor lock-in      

### 6.1 Directus

- **Adapter:** SQLite (via `@directus/data-driver-sqlite`)
- **Collections:** `profile`, `skills`, `projects`, `posts`, `questions`
- **Hook:** A Directus Action Hook fires `on('items.update')` and `on('items.create')` for all collections, setting `locked = true` and `sync_source = 'cms'` on the affected row.

```typescript
// tools/cms/src/hooks/lock-on-save.ts
export default ({ action }) => {
  const tables = ['profile', 'skills', 'projects', 'posts', 'questions'];
  tables.forEach(table => {
    action(`${table}.items.create`, async ({ key }, { database }) => {
      await database(table).where({ id: key }).update({ locked: true, sync_source: 'cms' });
    });
    action(`${table}.items.update`, async ({ keys }, { database }) => {
      await database(table).whereIn('id', keys).update({ locked: true, sync_source: 'cms' });
    });
  });
};
```

- **Display fields:** `sync_source` and `locked` are surfaced as read-only fields in all collection views so the author can see entity ownership at a glance.