import { createDebugger } from '..';

export const LABEL = 'yarn';
export const debug = createDebugger(LABEL);

export interface Result {
  label: string;
  process: string;
}

export const getResult = (process: string) => ({ label: LABEL, process });
