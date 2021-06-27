import * as chalk from 'chalk';
import { tryCatch } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { createMaterials, logAndThrow, getShellLineSize } from '../utils/index';
import { getResult, debug } from './index';
import { gitRemote } from './remote';

import type { PullResult } from 'simple-git';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { Reader } from 'fp-ts/Reader';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { Dependencies, Result } from './index';

export type GitPullParams = [
  remote?: string,
  branch?: string,
  showRemote?: boolean
];
export type GitPull = (
  ...params: GitPullParams
) => ReaderTaskEither<Dependencies, Error, Result>;

const PROCESS = 'pull';
const pullDebug = debug.step(PROCESS);

const gitPull: GitPull =
  (
    remote,
    branch,
    showRemote = true
  ): Reader<Dependencies, TaskEither<Error, Result>> =>
  (dependencies: Dependencies) => {
    const { cwd, git } = dependencies;

    const { spinner, spinnerLog } = createMaterials({
      color: 'yellow',
    });

    return tryCatch(
      async function runPull() {
        if (showRemote) {
          await gitRemote(remote)(dependencies)();
        }

        pullDebug.start('pull');
        spinner.start('pulling...');
        const result = await git
          .cwd({ path: cwd, root: false })
          .pull(remote, branch, {});

        pullDebug.step('result')('%O', result);

        if (result.summary.changes) {
          _logInfo(result, spinnerLog);
        } else {
          spinnerLog(`  Nothing Has Changed`);
        }

        spinner.succeed('git pull success 😊');
        pullDebug.done();

        return getResult(PROCESS);
      },
      function pullError(reason) {
        spinner.fail('git pull failed 😭');
        pullDebug.fail(reason);

        return logAndThrow(reason);
      }
    );
  };
// const defaultGitPull = R.asks((a: Dependencies) => gitPull({})(a));

export const defaultGitPull: RTE.ReaderTaskEither<Dependencies, Error, Result> =
  pipe(
    RTE.asks<Dependencies, never, Dependencies>((env: Dependencies) => env),
    RTE.chainTaskEitherK((dep: Dependencies) => gitPull()(dep))
  );

export default defaultGitPull;
export { gitPull };

function _logInfo(
  { files, deletions, insertions }: PullResult,
  spinnerLog: (info: any) => void
) {
  spinnerLog('\n');
  // const logs: (() => void)[] = [];
  let maxBaseNum = 0;
  const blockWidth = Math.floor(getShellLineSize().width / 2) - 3;

  files
    .map((fileName) => {
      const insertNum = insertions[fileName] || 0;
      const deleteNum = deletions[fileName] || 0;
      const changeds = insertNum + deleteNum;
      const changedStr = String(changeds);

      // 2: nameStr start with 2 empty;
      const nameLen = blockWidth - 2;

      maxBaseNum = maxBaseNum < changeds ? changeds : maxBaseNum;
      return () => {
        spinnerLog(
          `  ${fileName
            .slice(0, nameLen > 0 ? nameLen : 0)
            .padEnd(blockWidth, ' ')}` +
            ' | ' +
            ` ${chalk.yellow(changedStr)} ` +
            chalk
              .green('+')
              .repeat(
                insertNum * ((blockWidth - 2 - changedStr.length) / maxBaseNum)
              ) +
            chalk
              .red('-')
              .repeat(
                deleteNum * ((blockWidth - 2 - changedStr.length) / maxBaseNum)
              )
        );
      };
    })
    .forEach((l) => l());
  spinnerLog('\n');

  // log(
  //   `changes: ${chalk.bold.yellow(changes)} ` +
  //     `deletions: ${chalk.bold.yellow(dl)} ` +
  //     `insertions: ${chalk.bold.yellow(ins)}`
  // );
}
