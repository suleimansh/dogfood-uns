/** The filesystem this module needs. Injectable so the scan is testable. */
export interface LinkFs {
    /** Entry names in a directory. A missing/unreadable dir yields `[]`. */
    readdir(path: string): Promise<string[]>;
    /** True when `path` is a directory (following symlinks). Any error reads as `false`. */
    isDirectory(path: string): Promise<boolean>;
    /** True when anything exists at `path`, symlinks included (no link following). */
    entryExists(path: string): Promise<boolean>;
    /** Recursive. */
    mkdir(path: string): Promise<void>;
    /** Create a directory symlink at `path` pointing to `target`. */
    symlinkDir(target: string, path: string): Promise<void>;
}
/** The `node:fs/promises` implementation of {@link LinkFs}. */
export declare function nodeLinkFs(): LinkFs;
/**
 * Every `node_modules` directory in `repo`, as repo-relative paths, down to
 * {@link MAX_DEPTH}. Sorted, so the linking order (and any log of it) is stable.
 */
export declare function findDependencyDirs(repo: string, fs?: LinkFs): Promise<string[]>;
/**
 * Mirror `repo`'s dependency trees into `worktree` at the same relative paths: a real
 * directory per tree, holding a link per entry (the package manager's private state
 * left out, see above). Returns the trees mirrored. Best-effort throughout: a worktree
 * with no deps is a worse run, not a failed one, so a link that cannot be made is
 * skipped rather than thrown. A tree already present is left alone (the agent may
 * have installed already).
 */
export declare function linkDependencies(repo: string, worktree: string, fs?: LinkFs): Promise<string[]>;
//# sourceMappingURL=worktree-deps.d.ts.map