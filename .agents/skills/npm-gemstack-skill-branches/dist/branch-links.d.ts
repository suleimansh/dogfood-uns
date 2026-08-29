import { type GitRunner } from './git.js';
import { type WorktreeDirEntry } from './worktree.js';
/** The filesystem the reconcile needs; `node:fs/promises` in production. */
export interface LinksFs {
    /** Names under `dir`; a missing dir yields `[]`. */
    readdir(dir: string): Promise<string[]>;
    /** Recursive mkdir. */
    mkdir(dir: string): Promise<void>;
    /** Create a symlink at `path` pointing to `target`. */
    symlink(target: string, path: string): Promise<void>;
    /** A symlink's target, or `undefined` when `path` is missing or not a symlink. */
    readlink(path: string): Promise<string | undefined>;
    /** Remove one file or symlink. */
    unlink(path: string): Promise<void>;
    /** Whether anything (file, dir, or dangling link) sits at `path`. */
    lexists(path: string): Promise<boolean>;
}
/** Injectable seams for {@link reconcileBranchLinks}. */
export interface BranchLinksDeps {
    git?: GitRunner;
    fs?: LinksFs;
    /** The checkouts on disk (default {@link worktreeDirEntries}). */
    worktrees?: (cwd: string) => Promise<WorktreeDirEntry[]>;
    /** The branch a worktree is on, or none when the path is not a worktree root (default {@link worktreeBranch}). */
    branchOf?: (path: string) => Promise<string | undefined>;
}
/**
 * Bring one project's `.branches/` links in line with its worktrees: one link per worktree, named
 * as the branch the worktree is on right now. Renames are covered by the same rule — the old name
 * stops being wanted and is dropped, the new one is created.
 *
 * Touches only what is provably ours: a link is created, replaced, or removed only when it points
 * (or would point) at a sibling checkout; anything else at those paths — a user's own file, dir,
 * or symlink — is left alone. Never throws.
 */
export declare function reconcileBranchLinks(cwd: string, deps?: BranchLinksDeps): Promise<void>;
//# sourceMappingURL=branch-links.d.ts.map