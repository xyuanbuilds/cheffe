export interface None {
  readonly _tag: 'None';
}
export interface Some<A> {
  readonly _tag: 'Some';
  readonly value: A;
}

export type Option<A> = None | Some<A>;
export type Maybe<A> = undefined | A;

interface Result {
  label: 'git';
  step: 'pull';
}

// 不超过 4个 重载的且第一个函数类型  参数类型获取
export type OverloadedParameters<T> = T extends {
  (...args: infer A1): any;
  (...args: infer A2): any;
  (...args: infer A3): any;
  (...args: infer A4): any;
}
  ? A1 | A2 | A3 | A4
  : T extends {
      (...args: infer A1): any;
      (...args: infer A2): any;
      (...args: infer A3): any;
    }
  ? A1 | A2 | A3
  : T extends {
      (...args: infer A1): any;
      (...args: infer A2): any;
    }
  ? A1 | A2
  : T extends (...args: infer A) => any
  ? A
  : any;
