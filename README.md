# mmake

A modern make-like build tool which is based on webpack.

**UNFINISHED, NOTHING WORKS**

## tasks

Define tasks as functions:

```javascript
export let hello = () =>
  console.log('Hello, world!')
```

Run as:

```
% m hello
Hello, world!
```

## async tasks

Define async tasks as async functions, manage async control flow with promises:

```javascript
export let hello = async () => {
  console.log('Wait a sec')
  await new Promise(resolve => setTimeout(resolve, 1000))
  let msg = await Promise.resolve('Hello')
  console.log(msg)
}
```

Run as:

```
% m hello
Wait a sec
Hello, world!
```

## bundle

```javascript
import {bundle} from 'mmake'

export let build = bundle({
  entry: './web.js',
  output: './output',
  // other standard webpack config goes here
})
```

Run as:

```
% m bundle
```

Tasks of type `bundle` automatically support watch mode:

```
% m bundle --watch
```

## process

```javascript
import {process} from 'mmake'

export let build = process('./src/%.js', resource =>
  resource.process('babel').build('./lib/%.js'))

export let lint = process('./src/%.js', resource =>
  resource.process('eslint'))
```

Run as:

```
% m build
```

Tasks of type `map` automatically support watch mode:

```
% m build --watch
```

## combining tasks

Tasks can be combined:

```
% m build lint bundle
```

Even in watch mode:

```
% m build lint bundle --watch
```

Tasks of types `map` and `bundle` are combined in an efficient way which shares
I/O and caching.
