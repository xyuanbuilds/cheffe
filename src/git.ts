import simpleGit from 'simple-git';
import * as chalk from 'chalk';
import * as ora from 'ora';
import { tryCatch, sequenceArray } from 'fp-ts/TaskEither';
import { map as arrMap } from 'fp-ts/Array';
import { flow, pipe } from 'fp-ts/function';
import { createDebugger } from '.';
import { yarnInstall, yarnStart } from './yarn';

import type { SimpleGit, SimpleGitOptions } from 'simple-git';
import type { TaskEither } from 'fp-ts/TaskEither';

export const LABEL = 'git';
export const gitDebug = createDebugger(LABEL);
const spinner = ora({
  color: 'yellow',
});
const log = console.log;

const defaultOption: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
};
export const defaultGit: SimpleGit = simpleGit(defaultOption);

function logError(info: string) {
  console.error(chalk`${chalk.black.bgRed('Error')} ${info}`);
}

function getlogWithSpinner(spinInstance: ora.Ora) {
  return function logWithSpinner(info: any) {
    if (spinInstance) {
      spinInstance.clear();
      spinInstance.frame();
    }
    log(info);
  };
}

async function getCheckout(params: {
  cwd?: string;
  branch: string;
  git?: SimpleGit;
}) {
  const CUR_PROCESS = 'checkout';
  const { cwd, branch, git = defaultGit } = params;

  if (cwd) git.cwd(cwd);

  const checkoutDebug = gitDebug.step(CUR_PROCESS);

  checkoutDebug.start();
  checkoutDebug(`try to checkout to ${chalk.bold.yellow(branch)}`);

  const spinnerCheckout = ora({
    color: 'yellow',
  });

  const checkLog = getlogWithSpinner(spinnerCheckout);
  try {
    git.outputHandler((_, stdOut, stdErr) => {
      stdErr.on('data', (d) => {
        checkLog(d.toString().trim());
      });
      stdOut.on('data', (d) => {
        checkoutDebug(`%s received %L bytes`, 'stdOut', d);
        checkLog(d.toString().trim());
      });
      stdOut.on('end', () => {
        checkoutDebug(`no more data`);
      });
    });

    const result = await git
      .exec(() => {
        spinnerCheckout.start(`checkout to branch ${chalk.yellow(branch)}...`);
      })
      .checkout(branch)
      .exec(() => {
        spinnerCheckout.succeed('git checkout success 😊');
      });

    checkoutDebug.step('result')('%O', result);

    checkoutDebug.done();

    return {
      label: LABEL,
      process: CUR_PROCESS,
    } as const;
  } catch (err) {
    spinnerCheckout.fail('git checkout failed 😭');
    checkoutDebug(`[error] %O`, err);
    checkoutDebug.fail();
    console.error(chalk.red(err.message));
    throw err;
  }
}

function getRemoteOrigin(params: { git?: SimpleGit; cwd?: string } = {}) {
  const { cwd, git = defaultGit } = params;

  const CUR_PROCESS = 'remote';
  const remoteDebug = gitDebug.step(CUR_PROCESS);

  return tryCatch(
    async () => {
      remoteDebug.start();
      if (cwd) await git.cwd({ path: cwd });
      git.outputHandler((_, stdOut, stdErr) => {
        stdOut.on('data', (d) => {
          remoteDebug(`%s received %L bytes`, 'stdOut', d);
        });
        stdErr.on('data', (d) => {
          remoteDebug(d.toString().trim());
        });
        stdOut.on('end', () => {
          remoteDebug(`no more data`);
        });
      });
      const info = await git.remote(['show', 'origin']);

      const lines = info ? info.split('\n') : [];
      const address =
        lines.length > 1 && lines[1].includes('Fetch URL')
          ? lines[1].replace(/Fetch URL:/, '').trim()
          : '';
      log(chalk.green`${chalk.bgGreen.black('From')} ${address}`);
      remoteDebug.done();

      return {
        label: LABEL,
        process: CUR_PROCESS,
        address,
      } as const;
    },
    (reason) => {
      remoteDebug(`[error] %O`, reason);
      remoteDebug.fail();
      return new Error(String(reason));
    }
  );
}

type BasicResult = {
  readonly label: string;
  readonly process: string;
};

function getPull(
  params: { git?: SimpleGit; cwd: string } = { cwd: process.cwd() }
) {
  const { cwd, git = defaultGit } = params;

  const CUR_PROCESS = 'pull';
  const pullDebug = gitDebug.step(CUR_PROCESS);
  const spinnerPull = ora({
    color: 'yellow',
  });
  const pullLog = getlogWithSpinner(spinnerPull);

  return tryCatch<Error, BasicResult>(
    async function runPull() {
      pullDebug(`try to pull`);

      // cwdGit.outputHandler((_, stdOut, stdErr) => {
      //   stdOut.on('data', (d) => {
      //     pullDebug(`%s received %L bytes`, 'stdOut', d);
      //     pullLog(d.toString().trim());
      //   });
      //   stdErr.on('data', (d) => {
      //     pullLog(d.toString().trim());
      //   });
      //   stdOut.on('end', () => {
      //     pullDebug(`no more data`);
      //   });
      // });
      const result = await git
        .cwd({ path: cwd, root: false })
        .exec(() => {
          pullDebug.start();
        })
        .exec(() => {
          spinnerPull.start(`pulling...`);
        })
        .pull();
      spinnerPull.succeed('git pull success 😊');
      pullDebug.step('result')('%O', result);

      pullDebug.done();
      return {
        label: LABEL,
        process: CUR_PROCESS,
      };
    },
    function pullError(reason) {
      spinnerPull.fail('git pull failed 😭');
      pullDebug(`[error] %O`, reason);
      pullDebug.fail();

      console.log(typeof reason, reason instanceof Error);

      console.error(chalk.red(reason));
      return new Error(String(reason));
    }
  );
}

async function gitCheckoutThenInstall(
  branchName: string = 'main',
  cwd: string = process.cwd()
) {
  try {
    // const git = await getCWD({ cwd });
    // await getRemoteOrigin();
    // await getCheckout(branchName);

    // @ts-ignore
    // pipe(undefined, ...processes);

    // await yarnInstall(curPath);
    // await yarnStart(curPath);

    // await getPull({ cwd })();
    // await getPull()();
    sequenceArray([getPull({ cwd }), getPull()])();
  } catch (err) {
    gitDebug.info('checkout then install failed: %O', err);
    spinner.fail('checkout then install failed 😭');
    log(err);
  }
}

async function gitPrettyLog() {
  await defaultGit.addConfig(
    'alias.lg',
    "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --"
  );
  const res = await defaultGit.raw(['lg']);
  console.log(res);
}

export { gitPrettyLog, gitCheckoutThenInstall };

async function test() {
  gitCheckoutThenInstall(
    'release-4.8.0-1',
    '/Users/xuyuan/datatom/danastudio/web'
  );
}
test();
