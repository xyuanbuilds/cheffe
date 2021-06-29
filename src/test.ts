import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Reader';
import * as IO from 'fp-ts/IO';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
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

const aaa = { a: 1 };
const composition22 = flow(len, double, gt2).bind(aaa);
// 无意义
const composition111 = pipe(
  's',
  (param) => () => len(param),
  R.map(double),
  R.map(gt2)
);

const a = pipe(1, (n) => n * 2);

console.log(); // 'vero'
console.log(h('foo')({ ...instance, lowerBound: 4 })); // 'falso'

// more eg

// Error types
type HttpRequestError = {
  tag: 'httpRequestError';
  error: unknown;
};

type HttpContentTypeError = {
  tag: 'httpContentTypeError';
  error: unknown;
};

type HttpResponseStatusError = {
  tag: 'httpResponseStatusError';
  status: number;
};

// Interface
interface HttpClient {
  request(
    input: RequestInfo,
    init?: RequestInit
  ): TE.TaskEither<HttpRequestError, Response>;
}

// RTE "module" interface - for composing with other dependencies
interface HttpClientEnv {
  httpClient: HttpClient;
}

// "Live" implementation backed by `fetch`
const fetchHttpClient: HttpClient = {
  request: (input, init) =>
    TE.tryCatch(
      () => {
        return fetch(input, init);
      },
      (e: any) => ({
        tag: 'httpRequestError',
        error: e,
      })
    ),
};

// Interface
export interface Storage {
  getItem(key: string): IO.IO<O.Option<string>>;
  setItem(key: string, value: string): IO.IO<void>;
}

// RTE "module" interface - for composing with other dependencies
interface StorageEnv {
  storage: Storage;
}

// Implementation with DOM localStorage
export const domStorage: Storage = {
  getItem: (key: string) => () => O.fromNullable(localStorage.getItem(key)),
  setItem: (key: string, value: string) => () => {
    localStorage.setItem(key, value);
  },
};

interface HttpClientEnv {
  httpClient: HttpClient;
}
interface StorageEnv {
  storage: Storage;
}
const httpClientEnv: HttpClientEnv = { httpClient: fetchHttpClient };

const storageEnv: StorageEnv = { storage: domStorage };

type AppEnv = HttpClientEnv & StorageEnv; // & other envs types

const appEnv: AppEnv = { ...httpClientEnv, ...storageEnv /* ...other impls */ }; // { httpClient, storage, ... }

export const request = (
  input: RequestInfo,
  init?: RequestInit
): RTE.ReaderTaskEither<HttpClientEnv, HttpRequestError, Response> =>
  pipe(
    RTE.asks<HttpClientEnv, never, HttpClient>(
      (env: HttpClientEnv) => env.httpClient
    ),
    RTE.chainTaskEitherK((httpClient: HttpClient) =>
      httpClient.request(input, init)
    )
  );

const what = request('dddd')(httpClientEnv);

// Helper for extracting `json` response into `unknown` for decoding
export const toJson = (
  response: Response
): TE.TaskEither<HttpContentTypeError, unknown> =>
  TE.tryCatch(
    () => response.json(),
    (e: any) => ({ tag: 'httpContentTypeError', error: e })
  );

// Helper for validating response status
export const ensureStatus =
  (min: number, max: number) =>
  (response: Response): E.Either<HttpResponseStatusError, Response> =>
    min <= response.status && response.status < max
      ? E.right(response)
      : E.left({ tag: 'httpResponseStatusError', status: response.status });

// "High-level" helper for issuing a simple GET to a JSON endpoint
export const getJson = <A, DecodeError>(
  url: string,
  decode: (raw: unknown) => E.Either<DecodeError, A>
): RTE.ReaderTaskEither<
  HttpClientEnv,
  | HttpRequestError
  | HttpContentTypeError
  | HttpResponseStatusError
  | DecodeError,
  A
> =>
  pipe(
    request(url),
    RTE.chainEitherKW(ensureStatus(200, 300)), // ensureStatus operates on Either, so lift it (and widen error type) with chainEitherKW
    RTE.chainTaskEitherKW(toJson), // toJson operates on TaskEither, so lift into RTE (with widening)
    RTE.chainEitherKW(decode) // decode operates on Either... same deal
  );
const testJsonGet = getJson('sss', (raw) => E.of(raw))(httpClientEnv);

console.log(
  'Terminal size: ' +
    (process.stdout.columns || 10) +
    'x' +
    (process.stdout.rows || 10)
);
