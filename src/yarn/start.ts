import { spawn } from 'child_process';
import { tryCatch } from 'fp-ts/TaskEither';
import { isWin, logAndThrow } from '../utils/index';
import { getResult, debug } from './index';

import type { TaskEither } from 'fp-ts/TaskEither';
import type { Result } from './index';

export type YarnStartParams = [cwd?: string];
export type YarnStart = (
  ...params: YarnStartParams
) => TaskEither<Error, Result>;

const PROCESS = 'start';
const startDebug = debug.step(PROCESS);

const yarnStart: YarnStart = (cwd?: string) => {
  return tryCatch(
    () => {
      const command = isWin ? 'cmd.exe' : 'yarn';
      const args = isWin ? ['/c', 'yarn', 'start'] : ['start'];

      startDebug.start(PROCESS);
      const startCMD = spawn(command, args, { cwd, stdio: 'inherit' });
      startCMD;

      return new Promise((resolve, reject) => {
        process.on('SIGINT', function () {
          console.log('Caught interrupt signal');
          process.exit();
        });
        startCMD.on('exit', function (code, signal) {
          console.log('start exit', code, signal);
          if (code !== 0) {
            reject(code);
          } else {
            resolve(getResult(PROCESS));
          }
          startDebug.done();
        });
      });
    },
    (reason) => {
      startDebug.fail(reason);
      return logAndThrow(reason);
    }
  );
};

export { yarnStart };
