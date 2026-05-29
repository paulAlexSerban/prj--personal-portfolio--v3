import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--taskManager';
import { markdownFilesScanner, type ScannedDirectory } from './helpers/markdownFileScanner.ts';
import path from 'path';

const scanMarkdownFiles = markdownFilesScanner({
    baseDir: path.resolve('../../content/live/content/publish'),
});

const tasks: Task<ScannedDirectory[]>[] = [
    {
        name: 'Scan Markdown Files',
        action: () => scanMarkdownFiles(),
        dependsOn: [],
    },
/*     {
        name: 'Ingest MDX Files',
        action: (context) => {
            const scannedDirectories = context.getResult<ScannedDirectory[]>('Scan Markdown Files');
            for (const scannedDirectory of scannedDirectories) {
                console.log(scannedDirectory.typeName);
                for (const file of scannedDirectory.files) {
                    console.log(file);
                }
            }
            return [];
        },
        dependsOn: ['Scan Markdown Files'],
    }, */
];

const main = async () => {
    const executor = taskManager().init(tasks);
    await executor.execute();
    console.log(executor.getResult<ScannedDirectory[]>('Scan Markdown Files'));
};

main();
