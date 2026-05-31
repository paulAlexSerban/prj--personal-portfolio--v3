import { strict as assert } from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { taskManager, type Task } from './index.ts';

describe('taskManager', () => {
    beforeEach(() => {
        mock.method(console, 'log', () => {});
    });

    afterEach(() => {
        mock.restoreAll();
    });

    describe('init', () => {
        it('returns the manager for chaining', () => {
            const manager = taskManager();
            assert.strictEqual(manager.init([]), manager);
        });

        it('throws when a task depends on an unknown task', () => {
            const manager = taskManager();

            assert.throws(() => manager.init([{ name: 'A', dependsOn: ['Missing'], action: () => {} }]), /Task "A" depends on unknown task "Missing"/);
        });

        it('throws when tasks have a circular dependency', () => {
            const manager = taskManager();

            assert.throws(
                () =>
                    manager.init([
                        { name: 'A', dependsOn: ['B'], action: () => {} },
                        { name: 'B', dependsOn: ['A'], action: () => {} },
                    ]),
                /Circular dependency detected involving task: A/
            );
        });
    });

    describe('execute', () => {
        it('does nothing when there are no tasks', async () => {
            await assert.doesNotReject(taskManager().init([]).execute());
        });

        it('runs a single task', async () => {
            const action = mock.fn(() => {});
            await taskManager()
                .init([{ name: 'A', dependsOn: [], action }])
                .execute();

            assert.strictEqual(action.mock.callCount(), 1);
        });

        it('runs tasks in dependency order for a linear chain', async () => {
            const order: string[] = [];
            const track = (name: string, dependsOn: string[]): Task => ({
                name,
                dependsOn,
                action: () => {
                    order.push(name);
                },
            });

            await taskManager()
                .init([track('A', []), track('B', ['A']), track('C', ['B'])])
                .execute();

            assert.deepStrictEqual(order, ['A', 'B', 'C']);
        });

        it('runs independent tasks at the same level in parallel', async () => {
            const running = new Set<string>();
            let maxConcurrent = 0;

            const track = (name: string, dependsOn: string[], delayMs = 25): Task => ({
                name,
                dependsOn,
                action: async () => {
                    running.add(name);
                    maxConcurrent = Math.max(maxConcurrent, running.size);
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                    running.delete(name);
                },
            });

            await taskManager()
                .init([track('A', []), track('B', ['A']), track('C', ['A']), track('D', ['B', 'C'], 5)])
                .execute();

            assert.strictEqual(maxConcurrent, 2);
        });

        it('waits for all dependencies before running a task in a diamond graph', async () => {
            const order: string[] = [];

            const track = (name: string, dependsOn: string[]): Task => ({
                name,
                dependsOn,
                action: () => {
                    order.push(name);
                },
            });

            await taskManager()
                .init([track('A', []), track('B', ['A']), track('C', ['A']), track('D', ['B', 'C'])])
                .execute();

            assert.ok(order.indexOf('A') < order.indexOf('B'));
            assert.ok(order.indexOf('A') < order.indexOf('C'));
            assert.ok(order.indexOf('B') < order.indexOf('D'));
            assert.ok(order.indexOf('C') < order.indexOf('D'));
        });

        it('supports async task actions', async () => {
            const action = mock.fn(async () => {
                await new Promise((resolve) => setTimeout(resolve, 5));
            });

            await taskManager()
                .init([{ name: 'A', dependsOn: [], action }])
                .execute();

            assert.strictEqual(action.mock.callCount(), 1);
        });

        it('propagates errors from task actions', async () => {
            await assert.rejects(
                taskManager()
                    .init([
                        {
                            name: 'A',
                            dependsOn: [],
                            action: () => {
                                throw new Error('task failed');
                            },
                        },
                    ])
                    .execute(),
                /task failed/
            );
        });

        it('does not run downstream tasks when an upstream task fails', async () => {
            const downstream = mock.fn(() => {});

            await assert.rejects(
                taskManager()
                    .init([
                        {
                            name: 'A',
                            dependsOn: [],
                            action: () => {
                                throw new Error('task failed');
                            },
                        },
                        { name: 'B', dependsOn: ['A'], action: downstream },
                    ])
                    .execute(),
                /task failed/
            );

            assert.strictEqual(downstream.mock.callCount(), 0);
        });

        it('stores task results for access after execute', async () => {
            const executor = taskManager().init([
                {
                    name: 'A',
                    dependsOn: [],
                    action: () => ({ value: 42 }),
                },
            ]);

            await executor.execute();

            assert.deepStrictEqual(executor.getResult<{ value: number }>('A'), { value: 42 });
        });

        it('passes dependency results to downstream tasks via context', async () => {
            let downstreamResult: number | undefined;

            await taskManager()
                .init([
                    {
                        name: 'A',
                        dependsOn: [],
                        action: () => 10,
                    },
                    {
                        name: 'B',
                        dependsOn: ['A'],
                        action: (context) => {
                            downstreamResult = context.getResult<number>('A') * 2;
                        },
                    },
                ])
                .execute();

            assert.strictEqual(downstreamResult, 20);
        });

        it('prevents tasks from accessing results of non-dependencies', async () => {
            await assert.rejects(
                taskManager()
                    .init([
                        { name: 'A', dependsOn: [], action: () => 1 },
                        { name: 'B', dependsOn: [], action: () => 2 },
                        {
                            name: 'C',
                            dependsOn: ['B'],
                            action: (context) => {
                                context.getResult<number>('A');
                            },
                        },
                    ])
                    .execute(),
                /not a dependency/
            );
        });
    });
});
