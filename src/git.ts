import simpleGit from 'simple-git';
import * as chalk from 'chalk';
import * as ora from 'ora';

import { debug } from '.';
import { yarnInstall, yarnStart } from './yarn';

import type { SimpleGit, SimpleGitOptions } from 'simple-git';

const gitDebug = debug.extend('git');
const spinner = ora({
  color: 'yellow',
});
const log = console.log;

const options: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
};
// when setting all options in a single object
const git: SimpleGit = simpleGit(options);

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function logError(info: string) {
  console.error(chalk`${chalk.black.bgRed('Error')} ${info}`);
}

function logWithSpinner(spinInstance: ora.Ora, info: any) {
  if (spinInstance) {
    spinInstance.clear();
    spinInstance.frame();
  }
  log(info);
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

async function getPullLegacy(curPath: string = process.cwd()) {
  try {
    git.outputHandler((_, stdOut, stdErr, args) => {
      gitDebug(chalk`{bold stage: git.${args[0]}}`);

      stdErr.on('data', (d) => {
        logWithSpinner(spinner, d.toString().trim());
        spinner.text = `Received: ${d.length}b`;
      });
      stdOut.on('data', (d) => (spinner.text = `Received: ${d.length}b`));
      stdOut.on('end', () => {
        gitDebug(chalk`{bold stage: git.${args[0]} done}`);
      });
    });

    spinner.start();
    spinner.prefixText = 'git.cwd';

    await git.cwd(curPath);
    logWithSpinner(spinner, chalk`cur path: ${curPath}`);

    spinner.prefixText = 'git pull...';
    await git.pull();

    await delay(5000);

    spinner.prefixText = 'git.checkout';
    await git.checkout('dev');
    await git.pull();

    await delay(5000);

    spinner.stopAndPersist({
      text: `done`,
      prefixText: `${getPull.name}:`,
    });
    // const gitWithPath = git.cwd({ path });

    // // gitDebug('shit : %O', offsets);
    // const info = await gitWithPath
    //   .outputHandler((_, stdout, stderr, args) => {
    //     gitDebug('git pull start: %O', args);
    //     gitSpin.start('git pulling...');
    //     console.log(process.cwd());

    //     // stdout.pipe(process.stdout);
    //     // stderr.pipe(process.stderr);
    //   })
    //   .pull();

    // // gitDebug('git pull result: %O', info);
    // gitSpin.succeed('git pull success 😊');
  } catch (err) {
    // gitDebug('git pull failed: %O', err);
    spinner.fail('git pull failed 😭');
    console.error(err.message);
  }
}

async function getCheckout(branch: string) {
  const spinnerCheckout = ora({
    color: 'yellow',
  });

  const checkLog = getlogWithSpinner(spinnerCheckout);
  try {
    git.outputHandler((_, stdOut, stdErr, args) => {
      gitDebug(chalk`{bold stage: git.${args[0]}}`);

      stdErr.on('data', (d) => {
        checkLog(d.toString().trim());
      });
      stdOut.on('end', () => {
        gitDebug(chalk`{bold stage: git.${args[0]} done}`);
      });
    });

    spinnerCheckout.start(`checkout to branch ${chalk.yellow(branch)}...`);
    await git.checkout(branch);
    spinnerCheckout.succeed('git checkout success 😊');
  } catch (err) {
    spinnerCheckout.fail('git checkout failed 😭');

    console.error(err.message);
    throw err;
  }
}
async function getPull() {
  const spinnerPull = ora({
    color: 'yellow',
  });

  const pullLog = getlogWithSpinner(spinnerPull);
  try {
    git.outputHandler((_, stdOut, stdErr, args) => {
      gitDebug(chalk`{bold stage: git.${args[0]}}`);

      stdOut.on('data', (d) => {
        pullLog(d.toString().trim());
      });
      stdOut.on('end', () => {
        gitDebug(chalk`{bold stage: git.${args[0]} out end}`);
      });
      stdOut.on('close', () => {
        gitDebug(chalk`{bold stage: git.${args[0]} close}`);
      });

      stdErr.on('data', (d) => {
        pullLog(d.toString().trim());
      });
    });

    spinnerPull.start(`pulling...`);
    // const rawData = await git.raw('pull');
    await git.pull();
    // pullLog(rawData);
    spinnerPull.succeed('git pull success 😊');
  } catch (err) {
    spinnerPull.fail('git pull failed 😭');
    console.error(err.message);
    throw err;
  }
}

async function getCWD(curPath: string) {
  try {
    await git.cwd({ path: curPath, root: true });
    log(chalk.green`${chalk.bgGreen.black('Path')} ${curPath}`);
  } catch (err) {
    logError(`invalid path: ${curPath}`);
    throw err;
  }
}

async function gitCheckoutThenInstall(
  branchName: string = 'main',
  curPath: string = process.cwd()
) {
  try {
    await getCWD(curPath);
    await getPull();
    await getCheckout(branchName);
    await getPull();
    await yarnInstall(curPath);
    await yarnStart(curPath);
  } catch (err) {
    gitDebug('checkout then install failed: %O', err.message);
    spinner.fail('checkout then install failed 😭');
    log(err);
  }
}

async function gitPrettyLog() {
  await git.addConfig(
    'alias.lg',
    "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --"
  );
  const res = await git.raw(['lg']);
  console.log(res);
}

export { gitPrettyLog, gitCheckoutThenInstall };

async function test() {
  // const r = await git.listConfig();
  gitCheckoutThenInstall(
    'release-4.8.0-1',
    '/Users/xuyuan/datatom/danastudio/web'
  );
}
test();
