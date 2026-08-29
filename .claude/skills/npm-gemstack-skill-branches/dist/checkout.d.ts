import { type GitRunner } from './git.js';
import { type AddedWorktree } from './worktree.js';
/**
 * A checkout as an agent gets it (#1725): the worktree, `.branches/` hidden from git, the parent's
 * dependency trees linked in, the skill linked in where the agent's harness looks for it (#1739),
 * and the `.branches/` links brought up to date — one sequence, whichever surface asks for it (a
 * daemon allocating a run, the command line).
 */
/** A new agent's checkout, on a fresh `agent-<id>` branch from `base` or the project's head. */
export declare function createCheckout(repo: string, opts: {
    agentId: string;
    base?: string;
}, git?: GitRunner): Promise<AddedWorktree>;
/** A continued agent's checkout, back on the branch its work is on. */
export declare function attachCheckout(repo: string, opts: {
    agentId: string;
    branch: string;
}, git?: GitRunner): Promise<AddedWorktree>;
//# sourceMappingURL=checkout.d.ts.map