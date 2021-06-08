import * as chalk from 'chalk';
import { spawn } from 'child_process';
import { createDebugger, isWin } from '.';

const yarnDebug = createDebugger('yarn');

async function yarnInstall(cwd?: string) {
  const installDebug = yarnDebug.step('install');
  const command = isWin ? 'cmd.exe' : 'yarn';
  const args = isWin ? ['/c', 'yarn', 'install'] : ['install'];

  installDebug.start();
  const installCmd = spawn(command, args, {
    cwd,
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    installCmd.on('exit', function (code) {
      installDebug(`yarn install exit with code: ${chalk.bold(code)}`);
      if (code !== 0) {
        reject(code);
      } else {
        resolve(code);
      }
      installDebug.done();
    });
  });
}
async function yarnStart(cwd?: string) {
  const startDebug = yarnDebug.step('start');
  startDebug.start();
  try {
    const command = isWin ? 'cmd.exe' : 'yarn';
    const args = isWin ? ['/c', 'yarn', 'start'] : ['start'];
    spawn(command, args, { cwd, stdio: 'inherit' });
  } catch (err) {
    startDebug(`[error] %O`, err);
    startDebug.fail();
    console.error(chalk.bgRed.white(err.message));
    throw err;
  }
}

export { yarnInstall, yarnStart };

// async function test() {
//   process.stdin.pipe(process.stdout);
//   const spawnObj = spawn('git', ['status'], {
//     shell: '/bin/zsh',
//   });

//   spawnObj.stdout.pipe(process.stdout);
//   spawnObj.stdout.on('data', function (chunk) {
//     console.log(chunk.toString());
//   });
//   // spawnObj.stderr.on('data', (data) => {
//   //   console.log(data);
//   // });
//   // spawnObj.on('close', function (code) {
//   //   console.log('close code : ' + code);
//   // });
//   // spawnObj.on('exit', (code, single) => {
//   //   console.log('exit code : ' + code);
//   //   console.log('exit single : ' + single);
//   // });
// }

// test();
