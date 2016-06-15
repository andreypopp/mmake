/**
 * @flow
 */

import path from 'path';
import webpack from 'webpack';
import Compiler from 'webpack/lib/Compiler';
import ContextDependency from 'webpack/lib/dependencies/ContextDependency';
import {Minimatch} from 'minimatch';

class Recipe {

  constructor(loaderList = []) {
    this.loaderList = loaderList;
  }

  process(loader, query = {}) {
    let loaderList = this.loaderList.concat({loader, query});
    return new Recipe(loaderList);
  }

  request(resource) {
    if (this.loaderList.length ===  0) {
      return `!!${resource}`;
    } else {
      let loaderList = this.loaderList.map(loader => {
        let query = JSON.stringify(loader.query);
        return `${loader.loader}?${query}`;
      });
      return `!!${loaderList.join('!')}!${resource}`;
    }
  }
}

class Processor {

  constructor(context, pattern, process) {
    this.context = context;
    this.pattern = pattern;
    this.process = process;
  }

  apply(compiler) {
    compiler.plugin('compilation', (compilation, params) => {
      compilation.dependencyFactories.set(
        ContextDependency,
        params.contextModuleFactory
      );
    });

    compiler.plugin('make', (compilation, cb) => {
      let recipe = this.process(new Recipe());
      let req = recipe.request(this.context);
      let dep = new ContextDependency(req, true, this.pattern);
      compilation.prefetch(compiler.context, dep, err => {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      });
    });
  }
}

function reduceTasks(options, tasks) {
  let compiler = null;

  // Find if any of the tasks is a bundling task which means we can reuse the
  // compiler.
  tasks.forEach(task => {
    if (task instanceof Compiler) {
      if (compiler !== null) {
        throw new Error('Only single task of "bundle" type is allowed concurrently');
      }
      compiler = task;
    }
  });

  // If none of the tasks are bundle tasks then create one dummy compiler.
  if (compiler === null) {
    compiler = webpack({
      context: options.context,
    });
  }

  tasks.forEach(task => {
    task.apply(compiler);
  });

  return compiler;
}

export function process(context, pattern, process) {
  return new Processor(context, pattern, process);
}

export function bundle(config) {
  return webpack(config);
}

export function run(options, ...tasks) {
  return new Promise((resolve, reject) => {
    let compiler = reduceTasks(options, tasks);
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

export function watch(options, ...tasks) {
}
