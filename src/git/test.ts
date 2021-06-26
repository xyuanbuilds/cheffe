import { sequenceArray } from 'fp-ts/TaskEither';
// import { map as arrMap } from 'fp-ts/Array';
// import { flow, pipe } from 'fp-ts/function';
import defaultPull, { gitPull } from './pull';
import { gitPrettyLog } from './prettyLog';
import { gitDependencies } from './index';

const test = sequenceArray([
  gitPull()({
    ...gitDependencies,
    cwd: `/Users/xuyuan/datatom/danastudio/web`,
  }),
  defaultPull(gitDependencies),
  gitPull()({ ...gitDependencies, cwd: 'ssss' }),
  // gitPrettyLog()(gitDependencies),
])();

test
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
