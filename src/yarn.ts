import * as chalk from 'chalk';
import { spawn } from 'child_process';
import { debug } from '.';

const yarnDebug = debug.extend('yarn');

async function yarnInstall(cwd?: string) {
  const installCmd = spawn('yarn', ['install'], {
    cwd,
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    installCmd.on('exit', function (code) {
      yarnDebug(`yarn install exit with code: ${chalk.bold(code)}`);
      if (code !== 0) {
        reject(code);
      } else {
        resolve(code);
      }
    });
  });
}
async function yarnStart(cwd?: string) {
  spawn('yarn', ['start'], { cwd, stdio: 'inherit' });
}

export { yarnInstall, yarnStart };

async function test() {
  process.stdin.pipe(process.stdout);
  const spawnObj = spawn('git', ['status'], {
    shell: '/bin/zsh',
  });

  spawnObj.stdout.pipe(process.stdout);
  spawnObj.stdout.on('data', function (chunk) {
    console.log(chunk.toString());
  });
  // spawnObj.stderr.on('data', (data) => {
  //   console.log(data);
  // });
  // spawnObj.on('close', function (code) {
  //   console.log('close code : ' + code);
  // });
  // spawnObj.on('exit', (code, single) => {
  //   console.log('exit code : ' + code);
  //   console.log('exit single : ' + single);
  // });
}

// test();
