import { nodeGitRunner, pushBranch } from './git.js';
import { isAgentBranch } from './branch-names.js';
import { branchPushed, currentBranch, deleteBranch, isWorktreeRoot, pruneWorktrees, removeWorktree, worktreeClean, } from './worktree.js';
/**
 * Remove one checkout under the rule above. Throws only for a git failure past the decision
 * (the removal itself); every refusal is an outcome.
 */
export async function reclaimWorktree(repo, path, opts) {
    const git = opts.git ?? nodeGitRunner();
    // Before any git runs in it (#1654): a directory under `.branches/` that git does not know as
    // a worktree root makes every command below act on the enclosing repo — the user's checkout,
    // the user's branch. Nothing is pushed or deleted through it; it is left where it is.
    if (!(await isWorktreeRoot(path, git)))
        return { ok: false, reason: 'not-a-worktree' };
    const branch = await currentBranch(path, git);
    if (!branch)
        return { ok: false, reason: 'no-branch' };
    // Every way out below needs a clean tree: `removeWorktree` forces past a dirty one, so a dirty
    // tree is kept (#1638), and so is a tree git cannot read. Asked once, for all of them.
    if (!(await worktreeClean(path, git).catch(() => false)))
        return { ok: false, reason: 'dirty', branch };
    // Whether the checkout's branch goes with it (#1650): only when it provably holds nothing.
    let emptyBranch = false;
    if (opts.heldBy && (await coveredBy(path, branch, opts.heldBy, git))) {
        // A tip inside a commit the remote already has: nothing to push (#1601).
    }
    else if (isAgentBranch(branch) && (await branchHoldsNothing(repo, branch, git))) {
        // A branch whose tip the remote already has under another name — an agent that committed
        // nothing (#1650). The rule is satisfied before any push: what the checkout holds *is* on
        // the remote, so the branch goes with it; it is not the last copy of anything, by
        // construction. Only a branch minted for an agent, though: a leftover checkout can sit on
        // the user's own branch (one was found on `main`), and deleting that is not this code's call
        // even when it holds nothing — git's refusal to delete a checked-out branch must never be
        // the guard.
        emptyBranch = true;
    }
    else {
        if (!(await branchPushed(repo, branch, git))) {
            if (!opts.mayPush)
                return { ok: false, reason: 'not-on-remote', branch };
            // Pushing is what makes the removal recoverable, so it is attempted here rather than
            // required of the caller. A repo with no remote never gets past this, which is the honest
            // answer: there is nowhere for the work to be recoverable from.
            const pushed = await pushBranch(repo, branch, git);
            if (!pushed.ok)
                return { ok: false, reason: 'not-on-remote', branch, detail: pushed.error };
        }
    }
    // The birth branch (#1657) is judged before anything is deleted: the containment reads both refs.
    const birthBranchGoes = opts.birthBranch !== undefined && opts.birthBranch !== branch && (await branchContains(repo, branch, opts.birthBranch, git));
    await opts.beforeRemove?.();
    await removeWorktree(repo, path, git);
    await pruneWorktrees(repo, git);
    // After the checkout: git refuses to delete a branch a worktree still has checked out.
    const deleted = [];
    if (emptyBranch) {
        await deleteBranch(repo, branch, git);
        deleted.push(branch);
    }
    if (birthBranchGoes && opts.birthBranch) {
        await deleteBranch(repo, opts.birthBranch, git);
        deleted.push(opts.birthBranch);
    }
    return deleted.length ? { ok: true, branchesDeleted: deleted } : { ok: true };
}
/** Whether the branch tip is an ancestor of `anchor`. False on any doubt. */
async function coveredBy(path, branch, anchor, git) {
    return git(['merge-base', '--is-ancestor', branch, anchor], path).then(() => true, () => false);
}
/**
 * Whether a branch holds nothing the remote lacks (#1650): the tip is
 * reachable from some remote-tracking branch *other than the branch's own* — a commit `origin`
 * already has under another name, so nothing on the branch is unique to it. Its own remote copy
 * does not count: a pushed branch with a PR contains its own tip and is exactly the branch that
 * must stay. The branch's own copy is the one under its name, and the one it tracks — a branch
 * renamed after it was pushed (#1725) still tracks the remote copy under its old name, and that
 * copy holding the tip proves nothing about another name having it. Read from the local
 * remote-tracking refs, which are only ever behind the remote: a tip they do not cover yet
 * answers false, and the caller falls back to the push.
 */
async function branchHoldsNothing(repo, branch, git) {
    const upstream = await git(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`], repo).then(out => out.trim(), () => undefined);
    return git(['branch', '--remotes', '--contains', `refs/heads/${branch}`, '--format=%(refname:short)'], repo).then(out => out
        .split('\n')
        .map(line => line.trim())
        .some(name => name !== '' && !name.endsWith(`/${branch}`) && name !== upstream), () => false);
}
/** Whether `inner` exists and is an ancestor of (or equal to) `outer` — everything on it is on `outer` too. */
async function branchContains(repo, outer, inner, git) {
    return git(['merge-base', '--is-ancestor', `refs/heads/${inner}`, `refs/heads/${outer}`], repo).then(() => true, () => false);
}
//# sourceMappingURL=reclaim.js.map