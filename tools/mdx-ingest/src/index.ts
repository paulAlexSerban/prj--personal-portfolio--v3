import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--taskManager';

const tasks: Task[] = [
    {
        name: 'Ingest MDX Files',
        action: () => {
            console.log('Ingesting MDX files');
        },
        dependsOn: [],
    },
];

const main = async () => {
    const executor = taskManager().init(tasks);
    await executor.execute();
};

main();