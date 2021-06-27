import {
  sequenceArray,
  sequenceSeqArray,
  traverseArray,
} from 'fp-ts/TaskEither';
// import { map as arrMap } from 'fp-ts/Array';
// import { flow, pipe } from 'fp-ts/function';
import defaultPull, { gitPull } from './pull';
import { gitPrettyLog } from './prettyLog';
import { gitCheckout } from './checkout';
import { yarnStart } from '../yarn/start';
import { yarnInstall } from '../yarn/install';
import { gitDependencies } from './index';

// const test = sequenceSeqArray([
//   gitPull()({
//     ...gitDependencies,
//     cwd: `/Users/xuyuan/datatom/danastudio/web`,
//   }),
//   defaultPull(gitDependencies),
//   gitPull()({ ...gitDependencies, cwd: 'ssss' }),
//   // gitPrettyLog()(gitDependencies),
// ])();
const test = sequenceSeqArray([
  gitPull()({
    ...gitDependencies,
    cwd: `/Users/xuyuan/datatom/danastudio/web`,
  }),
  gitCheckout('dev')({
    ...gitDependencies,
    cwd: `/Users/xuyuan/datatom/danastudio/web`,
  }),
  gitPull()({
    ...gitDependencies,
    cwd: `/Users/xuyuan/datatom/danastudio/web`,
  }),
  yarnInstall(),
  yarnStart(`/Users/xuyuan/datatom/danastudio/web`),
])();

test
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
