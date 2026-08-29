import { type GitRunner } from './git.js';
/**
 * The command line over the package (#1725): the same functions a daemon calls, for an agent
 * (and a person) in a shell. One implementation, every surface a caller.
 *
 * The contract: JSON on stdout, one line for a person on stderr, and the exit code says how it
 * went — 0 for a result, 1 for a refusal or a git failure, 2 for a command that could not be
 * read. A refusal is a rule saying no (a dirty tree, a name that is not a session name); it is
 * reported on stdout as `{ ok: false, reason }` so a caller parsing the output learns why, and
 * on stderr so a person does.
 *
 * Where the project is comes from the working directory: for every command that acts on the
 * project (`create`, `attach`, `list`, `remove`, `prune`) it is the checkout whose `.branches/`
 * the working directory is under, else the checkout itself — so the
 * same command works from inside an agent's checkout; the commands that act on one checkout
 * (`name`, `status`) act on the one the working directory is in.
 */
export declare const USAGE = "usage: branches <command>\n\n  create <id> [--base <ref>]   a checkout for agent <id>, on a fresh branch agent-<id>\n  attach <id> <branch>         a checkout for agent <id>, on an existing branch\n  name <name>                  rename this checkout's branch to agent-<name>; prints the name it got\n  status [path]                the checkout's branch, whether it is clean, whether it is on the remote\n  list [--sizes]               every agent checkout under .branches/\n  remove <id> [--no-push]      reclaim agent <id>'s checkout, once the remote has everything it holds\n  prune [--no-push]            remove, for every checkout\n\nJSON on stdout. Exit code 1 for a refusal or a git failure (the reason on stderr), 2 for a usage error.";
/** The streams and the working directory a run of the CLI sees. */
export interface CliIo {
    cwd: string;
    stdout: (line: string) => void;
    stderr: (line: string) => void;
}
/** A refusal: a rule said no, and the caller learns which. */
export type CliRefusal = {
    ok: false;
    reason: string;
    [key: string]: unknown;
};
/** Run the CLI: `argv` is everything after the program name. Resolves to the exit code. */
export declare function runCli(argv: string[], io: CliIo, git?: GitRunner): Promise<number>;
//# sourceMappingURL=cli.d.ts.map