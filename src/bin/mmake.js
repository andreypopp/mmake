/**
 * @flow
 */

import path from 'path';
import fs from 'fs';
import Module from 'module';
import colour from 'colour';
import program from 'commander';
import {transform} from 'babel-core';
import {run, watch} from '../';

let context = process.cwd();

let args = program
  .option('-w, --watch', 'Watch for changes and re-run tasks')
  .parse(process.argv);

let tasksFilename = path.join(context, 'mmakefile');

if (!fs.existsSync(tasksFilename)) {
  error('Cannot find mmakefile in the current directory');
}

let tasks = loadTasksSync(tasksFilename);

let tasksToExecute = args.args.map(taskName => {
  if (tasks[taskName] == null) {
    error(`Unknown task "${taskName}"`);
  }
  return tasks[taskName];
});

if (args.watch) {
  watch(...tasksToExecute);
} else {
  run({context}, ...tasksToExecute)
    .then(stats => {
      console.log(stats.toString());
    })
    .catch(err => {
      error(err);
    });
}

function error(msg, code = 1) {
  if (msg instanceof Error) {
    console.error('error:'.red, msg.stack);
  } else {
    console.error('error:'.red, msg);
  }
  process.exit(code);
}

function loadTasksSync(filename) {
  let code = fs.readFileSync(filename, 'utf8');
  code = transform(code, {
    babelrc: false,
    presets: ['es2015'],
  }).code;
  let m = new Module(filename, module);
  m.filename = filename;
  m._compile(code, filename);
  return m.exports;
}
