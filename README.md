# PokGet Generator
A tool to scrape plugin information from the PocketMine website to use with a BukGet-like API/database. Code is provided in library form and can be used in other projects, but there's also a complete script to perform a full scrape under `examples/`.

## Requirements
- Node.js or io.js
- [Babel](http://babeljs.io)

## Setup
```shell
$ git clone git@github.com:cubedhost/pokget-generator
$ cd pokget-generator
$ npm install -g babel
$ npm install
```

We use ES6 / ECMAScript 2015 syntax and there are a couple ways to work with this. Installing Babel globally is optional but recommended.

### Using babel-node (recommended)
You can skip manually transpiling the source by using the `babel-node` CLI. This will run the example script using your system's Node.js/io.js installation.
```shell
$ babel-node examples/full-scrape.js
```

### Transpile
You can use `babel` to transpile the source to ES5 and then use it in non-ES6 projects.
```shell
$ babel index.js --out-file index.es5.js
```
```javascript
var gen = require('./index.es5');

gen.getLastPageNumber( function (err, lastPageNumber) {
  console.log('There are ' + lastPageNumber + ' total pages of plugins!');
});
```

### Using the Babel require hook
Finally, you can `require` the `babel-bootstrap.js` file and use it in non-ES6 projects.
```javascript
var gen = require('./babel-bootstrap');
```
