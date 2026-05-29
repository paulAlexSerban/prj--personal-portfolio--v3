export type TaskContext = {
    getResult: <T = unknown>(taskName: string) => T;
};

export type Task<TResult = void> = {
    name: string;
    action: (context: TaskContext) => TResult | Promise<TResult>;
    dependsOn: string[];
};

export type TaskManager = {
    init: (tasks: Task<unknown>[]) => TaskManager;
    execute: () => Promise<void>;
    getResult: <T = unknown>(taskName: string) => T;
};

const computeExecutionLevels = (tasks: Task<unknown>[]): Task<unknown>[][] => {
    const taskMap = new Map(tasks.map((task) => [task.name, task]));
    const levels = new Map<string, number>();
    const visiting = new Set<string>();

    const getLevel = (taskName: string): number => {
        if (levels.has(taskName)) {
            return levels.get(taskName)!;
        }

        if (visiting.has(taskName)) {
            throw new Error(`Circular dependency detected involving task: ${taskName}`);
        }

        const task = taskMap.get(taskName);
        if (!task) {
            throw new Error(`Unknown task: ${taskName}`);
        }

        visiting.add(taskName);

        const level =
            task.dependsOn.length === 0
                ? 0
                : Math.max(
                      ...task.dependsOn.map((dep) => {
                          if (!taskMap.has(dep)) {
                              throw new Error(`Task "${taskName}" depends on unknown task "${dep}"`);
                          }
                          return getLevel(dep) + 1;
                      }),
                  );

        visiting.delete(taskName);
        levels.set(taskName, level);
        return level;
    };

    tasks.forEach((task) => getLevel(task.name));

    const maxLevel = Math.max(...Array.from(levels.values()), -1);
    const grouped: Task<unknown>[][] = Array.from({ length: maxLevel + 1 }, () => []);

    for (const task of tasks) {
        grouped[levels.get(task.name)!].push(task);
    }

    return grouped;
};

export const taskManager = (): TaskManager => {
    let levels: Task<unknown>[][] = [];
    const results = new Map<string, unknown>();

    const getResult = <T = unknown>(taskName: string): T => {
        if (!results.has(taskName)) {
            throw new Error(`Task "${taskName}" has not completed or produced a result`);
        }

        return results.get(taskName) as T;
    };

    const createContext = (task: Task<unknown>): TaskContext => ({
        getResult: <T = unknown>(taskName: string): T => {
            if (!task.dependsOn.includes(taskName)) {
                throw new Error(`Task "${task.name}" cannot access result of "${taskName}" — not a dependency`);
            }

            return getResult<T>(taskName);
        },
    });

    const init = (tasks: Task<unknown>[]): TaskManager => {
        levels = computeExecutionLevels(tasks);
        return manager;
    };

    const execute = async (): Promise<void> => {
        results.clear();

        for (const level of levels) {
            await Promise.all(
                level.map(async (task) => {
                    console.log(`Starting task: ${task.name}`);
                    const result = await task.action(createContext(task));
                    results.set(task.name, result);
                    console.log(`Completed task: ${task.name}`);
                }),
            );
        }
    };

    const manager: TaskManager = { init, execute, getResult };
    return manager;
};
