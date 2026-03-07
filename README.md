# greyscript-interpreter

[![greyscript-interpreter](https://circleci.com/gh/ayecue/greyscript-interpreter.svg?style=svg)](https://circleci.com/gh/ayecue/greyscript-interpreter)

A bytecode interpreter for [GreyScript](https://github.com/ayecue/greybel-js) (the [Grey Hack](https://store.steampowered.com/app/605230/Grey_Hack/) flavour of MiniScript) written in TypeScript. It extends [greybel-interpreter](../greybel-interpreter) with GreyScript-specific parsing and bytecode generation via [greyscript-core](../greyscript-core).

## Features

* Extends `greybel-interpreter` with GreyScript-aware parsing and compilation
* Uses the GreyScript parser for bytecode generation and code injection
* Adds `classID`-based `toString` behaviour for `CustomMap` instances
* Inherits all greybel-interpreter capabilities: stack-based VM, debugger, pluggable handlers, environment variables, and custom intrinsics
* Written in TypeScript with type definitions included

## Install

```
npm install greyscript-interpreter
```

## Usage

```ts
import { Interpreter } from 'greyscript-interpreter';
import { HandlerContainer } from 'greybel-interpreter';

const interpreter = new Interpreter({
  target: '/path/to/main.src',
  handler: new HandlerContainer(),
  environmentVariables: new Map([['MY_VAR', '123']])
});

await interpreter.run();
```

## Testing

```
npm test
```
