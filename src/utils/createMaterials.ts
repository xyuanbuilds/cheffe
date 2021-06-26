// import * as chalk from 'chalk';
import * as ora from 'ora';
import { getlogWithSpinner } from './index';

export interface MaterialProps extends ora.Options {
  startText?: string;
}

export default function createMaterials({
  startText,
  ...oraOptions
}: MaterialProps) {
  const spinner = ora(oraOptions);
  if (startText) spinner.start(startText);
  // log会展示在 spinner 下方 而不会造成 spinner 重复
  const spinnerLog = getlogWithSpinner(spinner);
  return { spinner, spinnerLog };
}
