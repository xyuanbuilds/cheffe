import * as chalk from 'chalk';
import { tryCatch } from 'fp-ts/TaskEither';
import { getResult, debug } from './index';
import { log } from '../utils/index';

import type { TaskEither } from 'fp-ts/TaskEither';
import type { Reader } from 'fp-ts/Reader';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { Dependencies, Result } from './index';

const PROCESS = 'remote';
const remoteDebug = debug.step(PROCESS);

export type GitRemote = (
  remote?: string
) => ReaderTaskEither<Dependencies, Error, Result>;

const gitRemote: GitRemote =
  (
    remote: string = 'origin'
  ): Reader<Dependencies, TaskEither<Error, Result>> =>
  (deps: Dependencies) => {
    const { git, cwd } = deps;
    return tryCatch(
      async function gitRemote() {
        remoteDebug.start(PROCESS);

        const remoteInfo = await git
          .cwd({ path: cwd, root: false })
          .remote(['-v']);

        log(
          `${chalk.bgGreen.black('Remote')} ${chalk.bold(
            _getCurRemoteURL(remoteInfo, remote)
          )}`
        );

        remoteDebug.done();
        return getResult(PROCESS);
      },
      function remoteError(reason) {
        remoteDebug.fail(reason);
        return new Error('git remote error');
      }
    );
  };

export default gitRemote();
export { gitRemote };

function _getCurRemoteURL(info: string | void, remote: string) {
  const nil = chalk.gray(`(null)`);
  try {
    return info
      ? info
          .split('\n')
          .find((str) => {
            const arr = str.split('\t');
            return arr[0] === remote && arr[1].includes('(fetch)');
          })
          ?.split('\t')[1]
          .replace(/ \(fetch\)/, '')
      : nil;
  } catch (e) {
    remoteDebug.fail(e);
    return nil;
  }
}

// legacy
// function getRemoteOrigin(params: { git?: SimpleGit; cwd?: string } = {}) {
//   const { cwd, git = defaultGit } = params;

//   const CUR_PROCESS = 'remote';
//   const remoteDebug = gitDebug.step(CUR_PROCESS);

//   return tryCatch(
//     async () => {
//       remoteDebug.start();
//       if (cwd) await git.cwd({ path: cwd });
//       git.outputHandler((_, stdOut, stdErr) => {
//         stdOut.on('data', (d) => {
//           remoteDebug(`%s received %L bytes`, 'stdOut', d);
//         });
//         stdErr.on('data', (d) => {
//           remoteDebug(d.toString().trim());
//         });
//         stdOut.on('end', () => {
//           remoteDebug(`no more data`);
//         });
//       });
//       const info = await git.remote(['show', 'origin']);

//       const lines = info ? info.split('\n') : [];
//       const address =
//         lines.length > 1 && lines[1].includes('Fetch URL')
//           ? lines[1].replace(/Fetch URL:/, '').trim()
//           : '';
//       log(chalk.green`${chalk.bgGreen.black('From')} ${address}`);
//       remoteDebug.done();

//       return {
//         label: LABEL,
//         process: CUR_PROCESS,
//         address,
//       } as const;
//     },
//     (reason) => {
//       remoteDebug(`[error] %O`, reason);
//       remoteDebug.fail();
//       return new Error(String(reason));
//     }
//   );
// }
