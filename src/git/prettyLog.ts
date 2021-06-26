import * as chalk from 'chalk';
import { tryCatch } from 'fp-ts/TaskEither';
import { getResult, debug } from './index';
import { log } from '../utils/index';

import type { TaskEither } from 'fp-ts/TaskEither';
import type { Reader } from 'fp-ts/Reader';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { Dependencies, Result } from './index';

const PROCESS = 'pretty-log';
const plDebug = debug.step(PROCESS);

export type GitPrettyLog = () => ReaderTaskEither<Dependencies, Error, Result>;

const gitPrettyLog: GitPrettyLog =
  (): Reader<Dependencies, TaskEither<Error, Result>> =>
  (deps: Dependencies) => {
    const { git, cwd } = deps;
    return tryCatch(
      async function prettyLog() {
        const logInfo = await git
          .cwd({ path: cwd, root: false })
          .addConfig(
            'alias.lg',
            "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --"
          )
          .exec(() => {
            plDebug(`set alias.lg here: ${chalk.bgGreen.white(cwd)}`);
          })
          .raw(['lg']);

        log(`=============== ${chalk.bold('LOG')} ===============`);
        log(logInfo);
        log(`=============== ${chalk.bold('LOG')} ===============`);
        log(`use ${chalk.bold.bold('git lg')} to pretty log again!`);

        return getResult(PROCESS);
      },
      function prettyLogError() {
        return new Error('pretty log error');
      }
    );
  };

export default gitPrettyLog();
export { gitPrettyLog };
