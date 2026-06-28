# Task Manager (`shared/task-manager/`)

A tiny **dependency-aware task runner** for the CLI pipelines. You declare tasks
and what each depends on; it figures out a safe order, runs independent tasks in
parallel, and passes results down the graph.

**Package:** `@prj--personal-portfolio--v3/shared--task-manager`

## Why it exists

The content pipeline is a small DAG: sync content → ingest MDX → ingest JSON, some
steps feeding others. Rather than hand-wiring `await` order in each CLI, those
tools declare tasks and let this runner schedule them. No external dependencies.

## API

```ts
import { taskManager } from '@prj--personal-portfolio--v3/shared--task-manager';

await taskManager()
    .init([
        { name: 'sync', dependsOn: [], action: async () => cloneContent() },
        { name: 'mdx', dependsOn: ['sync'], action: async (ctx) => ingest(ctx.getResult('sync')) },
        { name: 'json', dependsOn: ['sync'], action: async (ctx) => ingestJson(ctx.getResult('sync')) },
    ])
    .execute(); // 'mdx' and 'json' run in parallel after 'sync'
```

A `Task` has a unique `name`, an `action(context)`, and a `dependsOn` list.

## Behaviour & guarantees

- **Level scheduling:** tasks are grouped into levels by dependency depth; each
  level runs concurrently (`Promise.all`), levels run in sequence.
- **Scoped results:** `context.getResult(name)` only returns a dependency's result.
  Reading a non-dependency throws — dependencies must be declared explicitly.
- **Fails fast at init:** circular dependencies and references to unknown tasks
  throw from `init()`, before anything runs.
- Logs `Starting…` / `Completed…` per task.

## How to run it

```bash
pnpm --filter @prj--personal-portfolio--v3/shared--task-manager test
```

`index.test.ts` covers level grouping and the dependency-access rules.

## Where it sits

- **Depends on:** nothing (standalone).
- **Consumed by:** `tools/content-sync`, `tools/mdx-ingest`, `tools/json-ingest`.

## Related docs

- `shared/AGENTS.md` — all shared packages.
- `tools/AGENTS.md` — the pipelines that use it.
