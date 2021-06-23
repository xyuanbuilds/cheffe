import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Reader';
import { pipe, flow } from 'fp-ts/function';

const parseIntResult: E.Either<string, number> = E.right(3);

const discardErrorMessage: O.Option<number> = O.fromEither(parseIntResult);

const addErrorMessage: E.Either<string, number> = pipe(
  discardErrorMessage,
  E.fromOption(() => 'could not parse to number')
);

console.log(
  pipe(
    addErrorMessage,
    // @ts-ignore
    E.foldW(
      () => 'shit',
      (v) => v
    )
  )
);

const lowercase = (a: string): string => a.toLowerCase();
const isAuthor = (a: string): boolean =>
  lowercase(a).includes('bell hooks') ||
  lowercase(a).includes('pattrice jones');
const lastName = (a: string): string | undefined =>
  a.split(' ').length > 1 ? a.split(' ')[1] : undefined;

const greet = (name: string | undefined): string =>
  pipe(
    O.fromNullable(name),
    O.chain(O.fromPredicate(isAuthor)),
    O.map(lowercase),
    O.alt(() =>
      pipe(O.fromNullable(name), O.chain(flow(lastName, O.fromNullable)))
    ),
    O.map((n) => `Hello ${n}`),
    O.getOrElse(() => 'Greetings!')
  );

console.log(greet('dai dai'));

export interface Dependencies {
  i18n: {
    true: string;
    false: string;
  };
  lowerBound: number;
}

const instance: Dependencies = {
  i18n: {
    true: 'vero',
    false: 'falso',
  },
  lowerBound: 2,
};
const f =
  (b: boolean): R.Reader<Dependencies, string> =>
  (deps) =>
    b ? deps.i18n.true : deps.i18n.false;

// const g = (n: number): Reader<Dependencies, string> => f(n > 2);

const h = (s: string): R.Reader<Dependencies, string> => g(s.length + 1);
const g = (n: number): R.Reader<Dependencies, string> =>
  pipe(
    R.ask<Dependencies>(),
    R.chain((deps) => f(n > deps.lowerBound))
  );

const P = pipe(instance, h('foo'));

const len = (s: string): number => s.length;
const double = (n: number): number => n * 2;
const gt2 = (n: number): number => n / 2;
const composition = flow(len, double, gt2);
const compositionValue = pipe('sss', len, double, gt2);
// equivalent to
const aa = R.map(double);

const lenf =
  (b: string): R.Reader<number, number> =>
  (deps) =>
    deps || b.length;

const composition1 = flow(len, R.ask<number>(), double, gt2);
const composition2 = flow(len, double, gt2);
const composition111 = pipe(
  's',
  (param) => () => len(param),
  R.map(double),
  R.map(gt2)
);

const a = pipe(1, (n) => n * 2);

console.log(); // 'vero'
console.log(h('foo')({ ...instance, lowerBound: 4 })); // 'falso'
