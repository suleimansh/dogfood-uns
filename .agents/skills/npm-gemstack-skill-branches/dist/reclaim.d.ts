import { type GitRunner } from './git.js';
/**
 * Reclaiming a checkout (#752/#737): the one implementation behind every surface that removes
 * one — a daemon's sweep and teardown, a dashboard's Remove button, an agent's own CLI.
 *
 * **One rule: only what is on the remote may go.** The checkout is removed only once the remote
 * has everything it holds: a clean tree, a pushed tip. Every deletion is therefore recoverable,
 * and nothing local is ever the last copy of anything. Nothing is committed on the agent's
 * behalf (#1638): a checkout holding uncommitted work is kept, until a person commits or deletes
 * it. There is one failure mode, and it is legible: the push did not land, so the checkout stays
 * and the refusal says why.
 *
 * What the caller knows and git does not comes in as options: whether the checkout's branch may
 * be pushed at all, and a pushed commit that already holds everything the checkout could.
 */
export interface ReclaimOptions {
    /**
     * The branch the checkout was created on, when that may differ from the branch it ended on: an
     * agent that branched away leaves it behind, and it goes with the checkout once the branch the
     * checkout ended on contains it (#1657).
     */
    birthBranch?: string;
    /**
     * Whether the branch may be pushed to satisfy the rule. When not, only a clean tree on a tip the
     * remote already has goes — removing what the remote holds publishes nothing (#1379).
     */
    mayPush: boolean;
    /**
     * A commit the remote already has that provably holds everything this checkout could — the commit a
     * cloud session pushed on the agent's behalf, say (#1601). A clean tree whose tip is inside it goes without a push, and keeps
     * its branch. Anything short of that proof falls back to the ordinary rule.
     */
    heldBy?: string;
    /** Run once removal is decided, just before the checkout goes: stop what serves the tree. */
    beforeRemove?: () => Promise<void>;
    git?: GitRunner;
}
/** Why {@link reclaimWorktree} left a checkout where it was. */
export type ReclaimRefusal = 
/** The directory is not a git worktree root: nothing was run in it (#1654). */
'not-a-worktree'
/** The checkout is on no branch (detached). */
 | 'no-branch'
/** The tree holds uncommitted work. */
 | 'dirty'
/** The branch tip is not on the remote, and could not (or may not) be pushed. */
 | 'not-on-remote';
export type ReclaimOutcome = {
    ok: true;
    /**
     * Branches that went with the checkout: the branch it was on, when that held nothing the
     * remote lacks (#1650); the birth branch, when everything on it is in the branch that stays
     * (#1657). Absent when nothing went.
     */
    branchesDeleted?: string[];
} | {
    ok: false;
    reason: 'not-a-worktree' | 'no-branch';
} | {
    ok: false;
    reason: 'dirty' | 'not-on-remote';
    /** The branch the checkout is on. */
    branch: string;
    /** What git said, for a push that did not land. */
    detail?: string;
};
/**
 * Remove one checkout under the rule above. Throws only for a git failure past the decision
 * (the removal itself); every refusal is an outcome.
 */
export declare function reclaimWorktree(repo: string, path: string, opts: ReclaimOptions): Promise<ReclaimOutcome>;
//# sourceMappingURL=reclaim.d.ts.map