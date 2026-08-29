import { type GitRunner } from './git.js';
/**
 * Git-worktree lifecycle for concurrent agents (#453/#735): give each agent its own
 * checkout so N agents on one repo never fight over the working tree. Pure plumbing
 * over the {@link GitRunner} seam: this module only knows how to add, list, name,
 * remove, and prune worktrees, and to read what a retention decision needs.
 */
/** The path an agent's worktree gets (#1580): `<repo>/.branches/<agent branch>`. */
export declare function worktreePath(repo: string, agentId: string): string;
/** One checkout on disk: where it is, and whose it is. */
export interface WorktreeDirEntry {
    path: string;
    agentId: string;
}
/**
 * Lists the names of the *directories* under `path` — a symlink is not one, whatever it points
 * to. A missing or unreadable directory yields `[]`.
 */
export type DirReader = (path: string) => Promise<string[]>;
/**
 * Every checkout directory on disk (#1580): a directory under `.branches/` named as an agent
 * branch. Only directories count — the same place holds the rename links (#1589), symlinks named
 * as agent branches too, which are views, not checkouts. Forgiving: a missing root yields nothing.
 */
export declare function worktreeDirEntries(repo: string, readdir?: DirReader): Promise<WorktreeDirEntry[]>;
/**
 * The agent ids that have a worktree directory (#737/#1580). Forgiving — a project that never ran
 * concurrently has no such dir and yields `[]`.
 */
export declare function listWorktreeDirs(repo: string, readdir?: DirReader): Promise<string[]>;
/** One entry parsed from `git worktree list --porcelain`. */
export interface WorktreeInfo {
    /** Absolute worktree path (the main checkout included). */
    path: string;
    /** The checked-out commit. */
    head: string;
    /** The checked-out branch (short name), or absent when detached. */
    branch?: string;
}
/** Inputs to {@link addWorktree}. The caller owns branch naming (#736). */
export interface AddWorktreeOptions {
    agentId: string;
    /** The branch to create for the agent. */
    branch: string;
    /** Base ref to branch from; defaults to the repo's current HEAD. */
    base?: string;
}
/** The worktree {@link addWorktree} created. */
export interface AddedWorktree {
    path: string;
    branch: string;
}
/**
 * Create a worktree for an agent on a fresh branch: `git worktree add -b <branch>
 * <path> [base]`. Git makes the leaf dir (and any missing parents) itself. The
 * `agentId` is validated as path-safe first so a caller can never traverse out of
 * `.branches/`. Rejects on any git failure (a caller that wants a
 * run needs its checkout, so failure must surface, not be swallowed).
 */
export declare function addWorktree(repo: string, opts: AddWorktreeOptions, git?: GitRunner): Promise<AddedWorktree>;
/**
 * Check an *existing* branch out into an agent's worktree (#762): `git worktree add <path> <branch>`,
 * no `-b`. Continuing an agent puts it back on the branch its work is already on, rather than
 * branching again from HEAD and stranding what it did last time.
 *
 * A branch that is gone is recreated from HEAD (#1650): the only branch the package deletes is
 * one that held nothing past a commit the remote already had, so HEAD is where its work was.
 * Anything else git refuses — the branch checked out elsewhere, say — still rejects, like
 * {@link addWorktree}: a continued agent needs its checkout.
 */
export declare function attachWorktree(repo: string, opts: {
    agentId: string;
    branch: string;
}, git?: GitRunner): Promise<AddedWorktree>;
/**
 * Every worktree registered for the repo (the main checkout included). Forgiving:
 * a non-repo / git failure yields `[]` so a reconcile scan never throws.
 */
export declare function listWorktrees(repo: string, git?: GitRunner): Promise<WorktreeInfo[]>;
/**
 * Parse `git worktree list --porcelain`: blank-line-separated records, each with
 * a `worktree <path>` line, a `HEAD <sha>` line, and either `branch refs/heads/...`
 * or `detached`. Extra attributes (bare/locked/prunable) are ignored. Exported so
 * the parsing is unit-testable without a real repo.
 */
export declare function parseWorktreeList(porcelain: string): WorktreeInfo[];
/**
 * Remove an agent's worktree. Tolerant of an already-gone / never-registered path so
 * teardown stays idempotent (a caller may run it twice).
 *
 * Plain removal first: it refuses a checkout git considers unclean, which after the
 * caller's {@link worktreeClean} check means a state we did not anticipate. Falling back to
 * `--force` keeps teardown working (an ignored build artifact must not strand a
 * worktree forever), but it says so, because forcing past unknown state is exactly
 * how uncommitted work got deleted in the first place.
 */
export declare function removeWorktree(repo: string, path: string, git?: GitRunner): Promise<void>;
/**
 * Delete a branch that holds nothing (#1650). `-D`, because "merged" in git's eyes is the wrong
 * test: the caller proved the tip is a commit the remote already has, which is the stronger fact.
 * Forgiving: the checkout is already gone by the time this runs, and a branch that would not
 * delete is a leftover name, not lost work.
 */
export declare function deleteBranch(repo: string, branch: string, git?: GitRunner): Promise<void>;
/**
 * Whether `path` is the root of a git worktree — the main checkout's or a linked one (#1654).
 *
 * Git answers for any directory *inside* a repository, so a `.branches/<agent>` directory that is
 * no longer a worktree (a checkout removed by hand, a marker written after teardown) makes every
 * git command run in it act on the enclosing repo: the user's own checkout, on the user's own
 * branch. The one question that tells the two apart is whether git's top level is this very
 * directory. False on any failure, and the caller leaves the directory alone.
 */
export declare function isWorktreeRoot(path: string, git?: GitRunner): Promise<boolean>;
/**
 * The branch checked out at `path` when `path` is a worktree root (#1654), else `undefined` —
 * the read every consumer of a `.branches/<agent>` directory wants, so none of them can take the
 * enclosing repo's branch for the run's.
 */
export declare function worktreeBranch(path: string, git?: GitRunner): Promise<string | undefined>;
/**
 * The branch checked out at `path`, or `undefined` when detached / not a repo.
 * Forgiving, like {@link listWorktrees}: callers use it to decide, not to fail.
 */
export declare function currentBranch(path: string, git?: GitRunner): Promise<string | undefined>;
/**
 * The project a directory belongs to (#1725): the checkout whose `.branches/` holds the agent
 * checkouts. From inside an agent's checkout that is two levels up, by the layout every checkout
 * is created with; from anywhere else it is the checkout itself. Read from the layout rather than
 * from git's common dir, so a project that is itself a linked worktree, or a submodule, answers
 * with the directory the caller registered. Rejects outside a repo.
 */
export declare function projectRoot(cwd: string, git?: GitRunner): Promise<string>;
/** A session name as the agent picks it: the charset the skill asks for. */
export declare function isSessionName(name: string): boolean;
/** Why {@link nameBranch} left the branch as it was. */
export type NameBranchRefusal = 
/** Not `[a-z0-9-]+`. */
'invalid-name'
/** The directory is not a git worktree root: nothing was run in it. */
 | 'not-a-worktree'
/** The checkout is on no branch (detached). */
 | 'no-branch'
/** The checkout is on a branch the package did not mint — the user's own. */
 | 'not-an-agent-branch';
export type NameBranchOutcome = {
    ok: true;
    /** The name the branch ends up with: `agent-<name>`, suffixed when that was taken. */
    branch: string;
} | {
    ok: false;
    reason: NameBranchRefusal;
};
/**
 * Name the session (#1725): rename the checkout's branch to `agent-<name>`. A rename, not a new
 * branch, so the branch the checkout was born on is the branch it ends on and nothing is left
 * behind to clean up. Only a branch the package minted is ever renamed: an agent that somehow
 * runs in the user's own checkout must not rename `main`.
 *
 * A taken name gets a numeric suffix (`agent-<name>-2`, `-3`, …) rather than a refusal: the agent
 * asked for a name, and the caller reads back the one it got. Taken means any local branch or
 * any remote-tracking branch, so the later push does not land on someone else's branch — except
 * the checkout's own branch, pushed or not, which is why asking again for the name the checkout
 * already carries (suffixed or not) changes nothing. Two checkouts naming the same thing at the
 * same moment race on the rename itself; the loser reads the branches again and takes the next
 * free suffix.
 */
export declare function nameBranch(path: string, name: string, git?: GitRunner): Promise<NameBranchOutcome>;
/**
 * `git worktree prune`: drop administrative entries for worktree dirs a crash left
 * behind. Never removes a live worktree, so it is always safe. Forgiving.
 */
export declare function pruneWorktrees(repo: string, git?: GitRunner): Promise<void>;
/** Runs `du`, resolving its stdout. Injectable so the size read can be tested without a real tree. */
export type SizeRunner = (path: string) => Promise<string>;
/** A {@link SizeRunner} over `du -sk`: one process, and it does not follow the symlinked deps (#736). */
export declare function nodeSizeRunner(): SizeRunner;
/**
 * A worktree's size on disk in bytes, or undefined when it cannot be read (#798). Best-effort by
 * design: this only ever labels a "remove this" button, so a missing number costs nothing while a
 * throw or a hang would cost the listing it sits in. `du` is absent on Windows, which reads as
 * unknown like any other failure.
 */
export declare function worktreeSize(path: string, size?: SizeRunner): Promise<number | undefined>;
/**
 * Whether a branch is on the remote, with the local tip already there.
 *
 * The one predicate the whole retention story is built on: nothing local is ever the last copy of
 * work, so anything the remote has may be deleted and anything it does not have stays. It replaced
 * three interacting rules — a clean finish removes the checkout, a failure keeps it, a merged
 * branch reclaims it later — each of which asked *what state did this session end in* rather than
 * *is this recoverable*.
 *
 * `git rev-parse` of the remote-tracking ref, then a merge-base check: the ref existing is not
 * enough, because a branch pushed and then committed to again has a tip the remote has never seen.
 * Reads only local refs (no fetch), so it is cheap enough to ask on every teardown — the remote ref
 * is written by the push this is checking for, which is what makes that sound.
 *
 * Anything unreadable answers `false`. A repo with no remote configured therefore keeps every
 * checkout, which is the honest outcome: there is nowhere for the work to be recoverable from.
 */
export declare function branchPushed(repo: string, branch: string, git?: GitRunner): Promise<boolean>;
/**
 * Whether the checkout has nothing uncommitted. A read, never a commit (#1638): the package
 * commits nothing on an agent's behalf, so a checkout holding uncommitted work is one the caller
 * keeps. Throws when git cannot answer, so the caller keeps the checkout rather than guessing.
 */
export declare function worktreeClean(path: string, git?: GitRunner): Promise<boolean>;
/**
 * Whether the repo has any remote configured at all. What a caller asks once per project before reclaiming its checkouts: with
 * no remote, {@link branchPushed} is false for every checkout and the push cannot land, so the
 * whole per-checkout probe-and-push cycle is doomed before it starts — and that answer cannot
 * change between two checkouts of the same pass. Anything unreadable answers `false`, like
 * {@link branchPushed}: keeping a checkout is the safe direction.
 */
export declare function repoHasRemote(repo: string, git?: GitRunner): Promise<boolean>;
//# sourceMappingURL=worktree.d.ts.map