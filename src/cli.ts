import yargs from 'yargs';
import * as chalk from 'chalk';
import { gitCheckoutThenInstall } from './git';

const v = process.version;

if (v && parseInt(v.slice(1)) < 10) {
  console.log(
    chalk.red(`Your node ${v} is outdated, please upgrade to 10 or above.`)
  );
  process.exit(1);
}

const argv = yargs(process.argv.slice(2)).help().alias({
  c: 'checkThenInstall',
  h: 'help',
  v: 'version',
}).argv;
// process.argv: [node, umi.js, command, args]
console.log(argv);
if ('c' in argv) {
  gitCheckoutThenInstall();
}
