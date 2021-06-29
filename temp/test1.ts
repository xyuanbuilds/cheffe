import { traverse, sequence } from 'fp-ts/Array';
import { sequenceT } from 'fp-ts/Apply';
import * as R from 'fp-ts/Reader';
import * as T from 'fp-ts/Task';
import { tryCatch } from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';

import type { Reader } from 'fp-ts/Reader';
import type { Task } from 'fp-ts/Task';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';

const test: (a: string) => Reader<number, number> = (a) => (b) => Number(a) * b;

const res = traverse(R.Applicative)(test)(['1', '2', '3'])(3);
const res1 = R.traverseArray(test)(['1', '2', '3'])(3);

const res01 = sequence(R.Applicative)([test('1'), test('2'), test('3')])(3);
const res02 = R.sequenceArray([test('1'), test('2'), test('3')])(3);

console.log(res, res1);

const test1: (b: number) => Task<number> = (b) => () =>
  new Promise<number>((r) => r(b * 2));
const res2 = traverse(T.ApplicativePar)(test1)([1, 2, 3])();
const res3 = T.traverseArray(test1)([1, 2, 3])();

const res21 = sequence(T.ApplicativePar)([test1(1), test1(2), test1(3)])();
const res22 = T.sequenceArray([test1(1), test1(2), test1(3)])();

const test22: (b: number) => Task<string> = (b) => () =>
  new Promise((r) => {
    setTimeout(() => {
      console.log('test22');
      r(String(b * 2));
    }, 200);
  });
const test23: (b: number) => Task<boolean> = (b) => () =>
  new Promise((r) => {
    setTimeout(() => {
      console.log('test23');
      r(b * 2 > 2);
    }, 100);
  });

// 依次执行
const res23 = sequenceT(T.ApplicativeSeq)(test22(1), test23(2))();

const testRE1: (a: string) => ReaderTaskEither<number, Error, string> =
  (a) => (b) =>
    tryCatch(
      () => new Promise((r) => r(String(Number(a) * b))),
      () => new Error('e')
    );
const testRE2: (a: string) => ReaderTaskEither<number, Error, number> =
  (a) => (b) =>
    tryCatch(
      () => new Promise((r) => r(Number(a) * b)),
      () => new Error('e')
    );

const resRE = sequenceT(RTE.ApplicativePar)(testRE1('1'), testRE2('2'))(2)();

// 不同返回类型无法进行，只能使用 sequenceT
// const resRE = RTE.sequenceSeqArray([testRE1('1'), testRE2('2')])(2)();

console.log(resRE);

console.log(res, res1);
