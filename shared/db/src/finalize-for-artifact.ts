import Database from 'better-sqlite3';

const dbPath = process.env['DATABASE_PATH'];
if (!dbPath) {
    console.error('[db:finalize] DATABASE_PATH is required');
    process.exit(1);
}

const db = new Database(dbPath);
db.pragma('wal_checkpoint(FULL)');

const profile = db.prepare('SELECT COUNT(*) AS c FROM profile').get() as { c: number };
const projects = db.prepare("SELECT COUNT(*) AS c FROM projects WHERE status = 'published'").get() as {
    c: number;
};
const posts = db.prepare("SELECT COUNT(*) AS c FROM posts WHERE status = 'published'").get() as { c: number };
const questions = db.prepare("SELECT COUNT(*) AS c FROM questions WHERE status = 'published'").get() as {
    c: number;
};

db.close();

console.log('[db:finalize] WAL checkpoint complete');
console.log('[db:finalize] counts:', {
    profile: profile.c,
    projects: projects.c,
    posts: posts.c,
    questions: questions.c,
});

if (profile.c === 0) {
    console.error('[db:finalize] content.db has no profile row — ingest likely failed or content repo is empty');
    process.exit(1);
}
