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
          `${chalk.bgGreen.black('Remote')}: ${chalk.bold(
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
