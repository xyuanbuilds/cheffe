import simpleGit from 'simple-git';
import * as chalk from 'chalk';
import * as ora from 'ora';

import { createDebugger } from '.';
import { yarnInstall, yarnStart } from './yarn';

import type { SimpleGit, SimpleGitOptions } from 'simple-git';

const gitDebug = createDebugger('git');
const spinner = ora({
  color: 'yellow',
});
const log = console.log;

const options: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
};
const git: SimpleGit = simpleGit(options);

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

async function getCheckout(branch: string) {
  const checkoutDebug = gitDebug.step('checkout');
  // checkoutDebug.info(`git.checkout ${chalk.bold('start')}`);
  checkoutDebug.start();
  checkoutDebug(`try to checkout to ${chalk.bold.yellow(branch)}`);

  const spinnerCheckout = ora({
    color: 'yellow',
  }).start(`checkout to branch ${chalk.yellow(branch)}...`);

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

    const result = await git.checkout(branch);
    checkoutDebug.step('result')('%O', result);
    spinnerCheckout.succeed('git checkout success 😊');
    checkoutDebug.done();
  } catch (err) {
    spinnerCheckout.fail('git checkout failed 😭');
    checkoutDebug(`[error] %O`, err);
    checkoutDebug.fail();
    console.error(chalk.red(err.message));
    throw err;
  }
}

async function getRemoteOrigin() {
  const remoteDebug = gitDebug.step('remote');
  remoteDebug.start();
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

  return address;
}

async function getPull() {
  const pullDebug = gitDebug.step('pull');
  pullDebug.start();

  await getRemoteOrigin();
  pullDebug(`try to pull`);
  const spinnerPull = ora({
    color: 'yellow',
  }).start(`pulling...`);

  const pullLog = getlogWithSpinner(spinnerPull);
  try {
    git.outputHandler((_, stdOut, stdErr) => {
      stdOut.on('data', (d) => {
        pullDebug(`%s received %L bytes`, 'stdOut', d);
        pullLog(d.toString().trim());
      });
      stdErr.on('data', (d) => {
        pullLog(d.toString().trim());
      });
      stdOut.on('end', () => {
        pullDebug(`no more data`);
      });
    });
    const result = await git.pull();
    pullDebug.step('result')('%O', result);
    spinnerPull.succeed('git pull success 😊');
    pullDebug.done();
  } catch (err) {
    spinnerPull.fail('git pull failed 😭');
    pullDebug(`[error] %O`, err);
    pullDebug.fail();
    console.error(chalk.red(err.message));
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
    gitDebug.info('checkout then install failed: %O', err);
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
  gitCheckoutThenInstall(
    'release-4.8.0-1',
    '/Users/xuyuan/datatom/danastudio/web'
  );
}
test();
