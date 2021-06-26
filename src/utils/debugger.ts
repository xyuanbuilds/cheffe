import debugCreator from 'debug';
import * as chalk from 'chalk';
import type { Debugger } from 'debug';

function createRootDebugger() {
  return debugCreator('cheffe');
}

interface DebuggerWithPrefixHandler extends Debugger {
  (message: string, ...args: any[]): void;
}
export interface CheffeDebugger extends Debugger {
  /** 主流程名 */
  readonly label: string;
  /** root debugger */
  info: DebuggerWithPrefixHandler;
  /** 获取阶段 debugger */
  step(nextStep?: string): CheffeDebugger;
  start(process: string, ...args: any[]): void;
  done(...args: any[]): void;
  fail(reason: unknown, ...args: any[]): void;
}

function getPrefixedDebugger(
  origin: Debugger,
  prefix?: string
): DebuggerWithPrefixHandler {
  if (!String(prefix).replace(/\s*/, '')) {
    return origin;
  }
  return Object.assign((message: string, ...args: any[]) => {
    origin(`%s ${message}`, prefix, ...args); // prefix 始终前置
  }, origin);
}

/**
 * 生产每个主流程的 debugger
 * @example
 * const gitDebugger = createProcessDebugger('git')
 *
 * @param label 当前主流程名称
 * @param initialStep? 初始步骤名称
 * @param rootDebugger? 与库同名的debugger
 * @returns
 */
export function createProcessDebugger(
  label: string,
  initialStep?: string,
  rootDebugger = createRootDebugger()
): CheffeDebugger {
  const labelPrefix = (label && `[${label}]`) || '';
  const labelDebugger = rootDebugger.extend(label);

  /**
   * 衍生主流程下各阶段的 debugger
   * @param  {CheffeDebugger|Debugger} this
   * @param  {string} phase? 阶段名
   * @param  {string} extraPrefix? 额外前缀标识
   * @returns CheffeDebugger
   */
  function step(
    this: CheffeDebugger | Debugger,
    phase?: string,
    extraPrefix?: string
  ): CheffeDebugger {
    const stepPrefix = (phase && `[${phase}]`) || '';
    const nextDebugger = phase ? this.extend(phase) : this;

    const prefixedDebugger = extraPrefix
      ? getPrefixedDebugger(nextDebugger, `[${extraPrefix}]`)
      : nextDebugger;

    const info = getPrefixedDebugger(
      rootDebugger,
      `${labelPrefix} ${stepPrefix}`
    );

    return Object.assign(prefixedDebugger, {
      info,
      label,
      start: (process: string, ...args: any[]) => {
        prefixedDebugger(`try to ${process}`);
        info(chalk.bold('start'), ...args);
      },
      done: (...args: any[]) => info(chalk.bold('done'), ...args),
      fail: (reason: unknown, ...args: any[]) => {
        prefixedDebugger(`[error] %O`, reason);
        info(chalk.bold('failed'), ...args);
      },
      step,
    });
  }

  return step.call(labelDebugger, initialStep);
}
