import * as chalk from 'chalk';
import { tryCatch } from 'fp-ts/TaskEither';
import { createMaterials, logAndThrow } from '../utils/index';
import { getResult, debug } from './index';

import type { TaskEither } from 'fp-ts/TaskEither';
import type { Reader } from 'fp-ts/Reader';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { Dependencies, Result } from './index';

const PROCESS = 'checkout';
const checkoutDebug = debug.step(PROCESS);

export type GitCheckout = (
  branch: string
) => ReaderTaskEither<Dependencies, Error, Result>;

const gitCheckout: GitCheckout =
  (branch: string): Reader<Dependencies, TaskEither<Error, Result>> =>
  (deps: Dependencies) => {
    const { git, cwd } = deps;
    const { spinner } = createMaterials({
      color: 'yellow',
    });

    return tryCatch(
      async function gitCheckout() {
        checkoutDebug.start(PROCESS);

        const result = await git
          .cwd({ path: cwd, root: false })
          .exec(() => {
            spinner.start(`checkout to branch ${chalk.yellow(branch)}...`);
          })
          .checkout(branch)
          .exec(() => {
            spinner.succeed('git checkout success 😊');
          });

        checkoutDebug.step('result')('%O', result);
        checkoutDebug.done();

        return getResult(PROCESS);
      },
      function checkoutError(reason) {
        spinner.fail('git pull failed 😭');
        checkoutDebug.fail(reason);
        return logAndThrow(reason);
      }
    );
  };

export { gitCheckout };
