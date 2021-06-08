export const NOOP: (...args: any[]) => void = () => {};

export function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
