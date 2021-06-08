import { createProcessDebugger } from './utils/debugger';
import { type } from 'os';

export const createDebugger = createProcessDebugger;
export const isWin = type() === 'Windows_NT';
