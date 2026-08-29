/**
 * Running git: one `execFile`-backed runner with a per-subcommand timeout, and the two readings
 * of a failed invocation every caller wants — was it a timeout kill, and which line is worth
 * showing.
 */
/** Runs `git` in `cwd`, resolving its stdout. Rejects on a non-zero exit. */
export type GitRunner = (args: string[], cwd: string) => Promise<string>;
/**
 * A local read: the index, a ref, or objects already on disk. Kept at the budget that used to
 * cover everything, so a hung read still fails fast instead of holding the caller longer (#997).
 */
export declare const GIT_READ_TIMEOUT_MS = 10000;
/** A local mutation. Bounded by disk, but an index write on a large repo outlives a read. */
export declare const GIT_WRITE_TIMEOUT_MS = 30000;
/**
 * The network, or a whole checkout. `git worktree add` writes every tracked file and `git push`
 * uploads a packfile; on a large repo both routinely pass 10s, which is what #997 is about.
 */
export declare const GIT_SLOW_TIMEOUT_MS = 120000;
/**
 * The timeout for one git invocation, chosen by subcommand (#997). One flat 10s budget once
 * covered every call site, so the slowest two ran under what is really a read's budget: a
 * SIGTERM'd `worktree add` drops an agent into the user's main checkout, a SIGTERM'd `push` may
 * have half-landed.
 */
export declare function gitTimeoutMs(args: string[]): number;
/**
 * A git killed for outrunning its timeout, as opposed to one git itself rejected (#997).
 *
 * `execFile` SIGTERMs on timeout, and a killed `git push` usually writes nothing to stderr, so
 * without this the failure surfaces as a bare "Command failed: git push ..." that reads like a
 * rejected push. The `timedOut` brand is what a caller across a package boundary checks.
 */
export declare class GitTimeoutError extends Error {
    readonly args: string[];
    readonly timeoutMs: number;
    readonly timedOut = true;
    constructor(args: string[], timeoutMs: number);
}
/** True when a {@link GitRunner} rejection is a timeout kill rather than a non-zero exit. */
export declare function isGitTimeout(err: unknown): err is GitTimeoutError;
/**
 * A {@link GitRunner} backed by `execFile('git', ...)`. Rejects on any git error, and with a
 * {@link GitTimeoutError} when the operation outran its {@link gitTimeoutMs} budget.
 *
 * The buffer is raised well past the default because a repo crawl (`git ls-files`) prints a
 * line per file, and a large checkout overruns it.
 */
export declare function nodeGitRunner(): GitRunner;
/**
 * Whether `cwd` sits inside a git working tree (#997). Lets a caller tell "this project cannot
 * host a worktree at all" from "git was there and the operation failed", which are the same
 * rejection out of `git worktree add` but call for opposite handling.
 *
 * Forgiving in one direction only: an unreadable / missing git reads as "no repo", which is the
 * conservative answer for the caller that treats a repo's failure as fatal.
 */
export declare function isGitRepo(cwd: string, git?: GitRunner): Promise<boolean>;
/** The root of the checkout `cwd` is in — an agent's own, from anywhere under it. Rejects outside a repo. */
export declare function checkoutRoot(cwd: string, git?: GitRunner): Promise<string>;
/**
 * The line of a failed git invocation worth showing: git's own `fatal:` / `error:` / `remote:`
 * line when there is one, else the first line, else a placeholder.
 */
export declare function gitReason(err: unknown): string;
/** Push a branch to `origin`, setting its upstream. The failure is git's own line, not a stack. */
export declare function pushBranch(repo: string, branch: string, git?: GitRunner): Promise<{
    ok: true;
} | {
    ok: false;
    error: string;
}>;
//# sourceMappingURL=git.d.ts.map