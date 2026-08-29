import { basename, join } from 'node:path';
import { nodeGitRunner } from './git.js';
import { BRANCHES_DIR, isAgentBranch } from './branch-names.js';
import { worktreeDirEntries, worktreeBranch } from './worktree.js';
/** A {@link LinksFs} over `node:fs/promises`. */
function nodeLinksFs() {
    const fs = () => import('node:fs/promises');
    return {
        readdir: dir => fs().then(f => f.readdir(dir)).catch(() => []),
        mkdir: dir => fs().then(f => f.mkdir(dir, { recursive: true })).then(() => { }),
        symlink: (target, path) => fs().then(f => f.symlink(target, path)),
        readlink: path => fs().then(f => f.readlink(path)).catch(() => undefined),
        unlink: path => fs().then(f => f.unlink(path)),
        lexists: path => fs().then(f => f.lstat(path)).then(() => true, () => false),
    };
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
export async function reconcileBranchLinks(cwd, deps = {}) {
    const git = deps.git ?? nodeGitRunner();
    const fs = deps.fs ?? nodeLinksFs();
    const worktrees = deps.worktrees ?? worktreeDirEntries;
    // A `.branches/` directory that is not a worktree root reads as no branch (#1654): otherwise
    // it reads as the enclosing repo's, and a link named after the user's own branch appears.
    const branchOf = deps.branchOf ?? ((path) => worktreeBranch(path, git));
    const linksDir = join(cwd, BRANCHES_DIR);
    /** Link name -> relative target, derived from what is actually checked out. */
    const wanted = new Map();
    for (const entry of await worktrees(cwd).catch(() => [])) {
        const branch = await branchOf(entry.path).catch(() => undefined);
        // A detached worktree has no name to link; a slashed name cannot be a
        // link name at all — both simply get no link.
        if (!branch || branch.includes('/'))
            continue;
        // The link is a sibling of the checkout. A dir already carrying the branch's name needs none.
        const target = basename(entry.path);
        if (branch === target)
            continue;
        wanted.set(branch, target);
    }
    // Drop our stale links: entries that are symlinks to a sibling checkout but no longer wanted,
    // or wanted with a different target (a reused branch name now belongs to a newer worktree).
    for (const name of await fs.readdir(linksDir)) {
        const path = join(linksDir, name);
        const target = await fs.readlink(path);
        if (target === undefined || !isAgentBranch(target))
            continue; // not ours to touch
        if (wanted.get(name) === target)
            continue;
        await fs.unlink(path).catch(() => { });
    }
    for (const [name, target] of wanted) {
        const path = join(linksDir, name);
        if (await fs.lexists(path))
            continue; // ours-and-current, or someone else's — either way, stay
        await fs.mkdir(linksDir);
        await fs.symlink(target, path).catch(() => { });
    }
}
//# sourceMappingURL=branch-links.js.map