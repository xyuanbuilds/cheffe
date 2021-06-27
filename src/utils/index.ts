import { type } from 'os';
import * as chalk from 'chalk';
import * as ora from 'ora';
import createMaterials from './createMaterials';

export const isWin = type() === 'Windows_NT';

export const logError = (info: string) => {
  console.error(chalk`${chalk.black.bgRed('Error')} ${info}`);
};
export const log = console.log;
export const logAndThrow = (reason: unknown) => {
  if (reason instanceof Error)
    log(`

  ${chalk.red(reason.message)}

  `);
  return new Error(String(reason));
};

export const getlogWithSpinner = (
  spinInstance: ora.Ora,
  extraLog: any = log
) => {
  return (info: any) => {
    if (spinInstance) {
      spinInstance.clear();
      spinInstance.frame();
    }
    extraLog(info);
  };
};

export const getShellLineSize = () => {
  return {
    width: process.stdout.columns || 10,
    height: process.stdout.rows || 10,
  };
};

export { createMaterials };
