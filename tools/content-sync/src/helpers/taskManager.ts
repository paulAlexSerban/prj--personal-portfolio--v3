export type Task = {
    name: string;
    action: () => void | Promise<void>;
    dependsOn: string[];
};

export type TaskManager = {
    init: (tasks: Task[]) => TaskManager;
    execute: () => Promise<void>;
};

const computeExecutionLevels = (tasks: Task[]): Task[][] => {
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
    const grouped: Task[][] = Array.from({ length: maxLevel + 1 }, () => []);

    for (const task of tasks) {
        grouped[levels.get(task.name)!].push(task);
    }

    return grouped;
};

export const taskManager = (): TaskManager => {
    let levels: Task[][] = [];

    const init = (tasks: Task[]): TaskManager => {
        levels = computeExecutionLevels(tasks);
        return manager;
    };

    const execute = async (): Promise<void> => {
        for (const level of levels) {
            await Promise.all(
                level.map(async (task) => {
                    console.log(`Starting task: ${task.name}`);
                    await task.action();
                    console.log(`Completed task: ${task.name}`);
                }),
            );
        }
    };

    const manager: TaskManager = { init, execute };
    return manager;
};
