import * as chalk from 'chalk';
import { spawn } from 'child_process';
import { tryCatch } from 'fp-ts/TaskEither';
import { isWin, logAndThrow } from '../utils/index';
import { getResult, debug } from './index';

import type { TaskEither } from 'fp-ts/TaskEither';
import type { Result } from './index';

export type YarnInstallParams = [cwd?: string];
export type YarnInstall = (
  ...params: YarnInstallParams
) => TaskEither<Error, Result>;

const PROCESS = 'pull';
const installDebug = debug.step(PROCESS);

const yarnInstall: YarnInstall = (cwd?: string) => {
  const command = isWin ? 'cmd.exe' : 'yarn';
  const args = isWin ? ['/c', 'yarn', 'install'] : ['install'];

  return tryCatch(
    () => {
      installDebug.start(PROCESS);
      const installCmd = spawn(command, args, {
        cwd,
        stdio: 'inherit',
      });
      return new Promise((resolve, reject) => {
        installCmd.on('exit', function (code) {
          installDebug.info(`yarn install exit with code: ${chalk.bold(code)}`);
          if (code !== 0) {
            reject(code);
          } else {
            resolve(getResult(PROCESS));
          }
          installDebug.done();
        });
      });
    },
    (reason) => {
      installDebug.fail(reason);

      return logAndThrow(reason);
    }
  );
};

export { yarnInstall };
