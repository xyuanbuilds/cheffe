import simpleGit from 'simple-git';
import { createDebugger } from '..';

import type { SimpleGit, SimpleGitOptions } from 'simple-git';

export const LABEL = 'git';
export const debug = createDebugger(LABEL);

const defaultOption: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
};
export const defaultGit: SimpleGit = simpleGit(defaultOption);

export interface Dependencies {
  git: SimpleGit;
  cwd: string;
}

export const gitDependencies: Dependencies = {
  git: defaultGit,
  cwd: process.cwd(),
};

export interface Result {
  label: string;
  process: string;
}

export const getResult = (process: string) => ({ label: LABEL, process });
