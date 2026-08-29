import { type GitRunner } from './git.js';
/** The filesystem the exclude write needs; `node:fs/promises` in production. */
export interface ExcludeFs {
    read(path: string): Promise<string>;
    /** Recursive mkdir. */
    mkdir(path: string): Promise<void>;
    append(path: string, contents: string): Promise<void>;
}
/**
 * Append one ignore rule to the repository's `info/exclude` — the ignore file that is git's, not
 * the project's, so no tracked file changes and no user ever sees a diff. The rule goes in the
 * *common* git dir because git resolves excludes from there; a per-worktree copy looks right and
 * is silently never read. One rule there covers every worktree of the repo. Idempotent. Throws on
 * a non-repo or unwritable git dir — callers decide whether that is fatal (so far, never).
 */
export declare function excludeFromGit(repo: string, rule: string, fs?: ExcludeFs, git?: GitRunner): Promise<void>;
//# sourceMappingURL=git-exclude.d.ts.map