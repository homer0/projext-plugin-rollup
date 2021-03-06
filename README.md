# projext plugin for Rollup

[![Travis](https://img.shields.io/travis/homer0/projext-plugin-rollup.svg?style=flat-square)](https://travis-ci.org/homer0/projext-plugin-rollup)
[![Coveralls github](https://img.shields.io/coveralls/github/homer0/projext-plugin-rollup.svg?style=flat-square)](https://coveralls.io/github/homer0/projext-plugin-rollup?branch=master)
[![David](https://img.shields.io/david/homer0/projext-plugin-rollup.svg?style=flat-square)](https://david-dm.org/homer0/projext-plugin-rollup)
[![David](https://img.shields.io/david/dev/homer0/projext-plugin-rollup.svg?style=flat-square)](https://david-dm.org/homer0/projext-plugin-rollup)

Allows [projext](https://yarnpkg.com/en/package/projext) to use [Rollup](https://rollupjs.org) as a build engine.

## Introduction

[projext](https://yarnpkg.com/en/package/projext) allows you to configure a project without adding specific settings for a module bundler, then you can decide which build engine to use. This plugin allows you to bundle your projext project targets using [Rollup](https://rollupjs.org).

## Information

| -            | -                                                                             |
|--------------|-------------------------------------------------------------------------------|
| Package      | projext-plugin-rollup                                                         |
| Description  | Allows projext to use Rollup as a build engine.                               |
| Node Version | >= v10.13.0                                                                    |

## Usage

Since projext automatically detects this plugin as a _"known build engine"_, after you install it, there's nothing else to do, just run the build command and the plugin will take care of the rest:

```bash
projext build [target-name]
```

### Middleware implementation

This plugin provides a development middleware for implementing on [Express](https://expressjs.com) and [Jimpex](https://yarnpkg.com/en/package/jimpex) very easy:

#### Express

```js
// Require the function for the implementation
const useExpress = require('projext-plugin-rollup/express');

// Require Express to create a dummy app
const express = require('express');

// Create the app
const app = express();

// Tell the plugin to configure the middleware for the `myApp` target to be served by the
// `myServer` target
useExpress(app, 'myApp', 'myServer');

// Start the app
app.listen(...);
```

#### Jimpex

```js
// Require the function for the implementation
const useJimpex = require('projext-plugin-rollup/jimpex');

// Require Jimpex to create a dummy app
const { Jimpex } = require('jimpex');

// Define the Jimpex app
class DevApp extends Jimpex {
  boot() {
    // This method needs to be created.
  }
}

// Create the app
const app = new DevApp();

// Tell the plugin to configure the middleware for the `myApp` target to be served by the
// `myServer` target
useJimpex(app, 'myApp', 'myServer');

// Start the app
app.start();
```

#### Accessing the file system

Both `useExpress` and `useJimpex` return and object with the following properties:

- `middleware`: A function that returns the actual middleware.
- `getDirectory`: A function that returns the build directory of the target implementing the middleware.
- `getFileSystem`: A function that returns a promise that eventually gets resolved with an instance of [`fs-extra`](https://yarnpkg.com/en/package/jimpex). The reason of this function is so the file system would be blocked while Rollup is processing the bundle.

### Extending/Overwriting the configuration

This plugin has `5` different configuration services:

- Plugins settings configuration.
- Browser targets configuration for development.
- Browser targets configuration for production.
- Node targets configuration for development.
- Node targets configuration for production.

They can be easily extended/overwritten by creating a file on your project with an specific name.

All the configurations receive a single object parameter with the following properties:

- `target`: It has all the information for the target being bundled.
- `targetRules`: The rules to find the target files on the file system.
- `input`: The path to the target entry file
- `output`: The Rollup output settings for the target.
- `paths`: A dictionary with the filenames formats and paths of the different files the bundle can generate (`js`, `css`, `images` and `fonts`).
- `definitions`: A function that generates a dictionary of variables that will be replaced on the bundled code.
- `buildType`: The indented build type (`development` or `production`).
- `copy`: A list of information for files that need to be copied during the bundling process.
- `additionalWatch`: A list of additional paths Rollup should watch for in order to restart the bundle.
- `analyze`: A flag to detect if the bundled should be analyzed or not. 

#### Plugins configuration

This configuration is a big dictionary where each key is the name of a plugin it contains settings for.

To extend/overwrite this configuration you would need to create a file with the following path: `config/rollup/plugins.plugins.js`. For example:

```js
// config/rollup/plugins.config.js

module.exports = (params) => ({
  resolve: {
  	 // Add the `.tsx` extension.
    extensions: ['.js', '.json', '.jsx', '.tsx'],
  },
});
```

#### Browser targets configuration for development and production

These services have all the specific configuration for building a browser target.

To extend/overwrite these configurations you would need to create a file with the following path: `config/rollup/browser.development.config.js` or `config/rollup/browser.production.config.js`. For example:

```js
// config/rollup/browser.development.config.js

module.exports = (params) => ({
  output: {
    globals: {
      'some-lib': 'someLib',
    },
  },
});
```

### Node targets configuration for development and production

These services have all the specific configuration for building a Node target.

To extend/overwrite these configurations you would need to create a file with the following path: `config/rollup/node.development.config.js` or `config/rollup/node.production.config.js`. For example:

```js
// config/rollup/node.production.config.js

module.exports = (params) => ({
  output: {
    exports: 'named',
  },
});
```

### Extending/Overwriting a target configuration

The methods above allow you to extend/overwrite a configuration service for all the targets, but there are two ways of extending/overwriting configurations for an specific target:

**`config/rollup/[target].config.js`**

This file allows you to overwrite the Rollup configuration generated for an specific target, no matter the build type:

```js
// config/rollup/myApp.config.js

module.exports = (params) => ({
  output: {
    exports: 'named',
  },
});
```

That change will only be applied when building the target `myApp`.

**`config/rollup/[target].[build-type].config.js`**

This file allows you to overwrite the Rollup configuration generated for an specific target and build type.

```js
// config/rollup/myApp.production.config.js

module.exports = (params) => ({
  output: {
    globals: {
      'some-lib': 'someLib',
    },
  },
});
```

That change will only be applied when building the target `myApp` on a production build.

### Code splitting

Using code splitting with projext is quite simple, you can [read about it on the site](https://homer0.github.io/projext/manual/codeSplitting.html), but when it comes to Rollup, there's something you should be aware: The script tag for the bundle will use [`type="module"`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

When you use code splitting with Rollup, Rollup will automatically take shared code between the chunks in order to create a "shared chunk", the "problem" is that the shared chunk is loaded using `import ... from '...'`, and when declared like that, `import` can only be used on scripts loaded using the `type="module"` attribute.

This makes it impossible to target old browsers and implement code splitting at the same time, so it may be recommendable to use a direct implementation of Rollup, with different builds, or [the webpack build engine](https://yarnpkg.com/en/package/projext-plugin-webpack).

## Making a plugin

If you want to write a plugin that works with this one (like a framework plugin), there are a lot of reducer events you can listen for and use to modify the Rollup configuration:

### Configuration parameters

- Name: `rollup-configuration-parameters`
- Reduces: The parameters used by the plugin services to build a target configuration.

This is called before generating any configuration.

### Node target configuration

- Name: `rollup-node-configuration`
- Reduces: A Rollup configuration for a Node target.
- Parameters:
 - `params`: The same dictionary sent to all the files that extend a configuration. Check the _"Extending/Overwriting the configuration"_ section for more information.

This is called after generating the configuration for a Node target and before using it.

### Browser target configuration

- Name: `rollup-browser-configuration`
- Reduces: A Rollup configuration for a browser target.
- Parameters:
 - `params`: The same dictionary sent to all the files that extend a configuration. Check the _"Extending/Overwriting the configuration"_ section for more information.

This is called after generating the configuration for a browser target and before using it.

### Plugins configuration

- Name: `rollup-plugin-settings-configuration`
- Reduces: A dictionary with all the settings a target may use.
- Parameters:
 - `params`: The same dictionary sent to all the files that extend a configuration. Check the _"Extending/Overwriting the configuration"_ section for more information.

This is called after defining all the settings for plugins a target may use and before sending them to the main configuration.

> There are a LOT more reducer events, check the project documentation.

## Development

### NPM/Yarn Tasks

| Task                    | Description                         |
|-------------------------|-------------------------------------|
| `yarn test`             | Run the project unit tests.         |
| `yarn run lint`         | Lint the modified files.            |
| `yarn run lint:full`    | Lint the project code.              |
| `yarn run docs`         | Generate the project documentation. |
| `yarn run todo`         | List all the pending to-do's.       |

### Testing

I use [Jest](https://facebook.github.io/jest/) with [Jest-Ex](https://yarnpkg.com/en/package/jest-ex) to test the project. The configuration file is on `./.jestrc`, the tests and mocks are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Linting

I use [ESlint](http://eslint.org) with [my own custom configuration](http://yarnpkg.com/en/package/eslint-plugin-homer0) to validate all the JS code. The configuration file for the project code is on `./.eslintrc` and for the tests on `./tests/.eslintrc`, there's also an `./.eslintignore` to ignore some files on the process, and the script that runs it is on `./utils/scripts/lint`.

### Documentation

I use [ESDoc](https://esdoc.org) to generate HTML documentation for the project. The configuration file is on `./.esdocrc` and the script that runs it is on `./utils/scripts/docs`.

### To-Dos

I use `@todo` comments to write all the pending improvements and fixes, and [Leasot](https://yarnpkg.com/en/package/leasot) to generate a report. The script that runs it is on `./utils/scripts/todo`.
