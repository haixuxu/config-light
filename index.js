'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const chalk = require('chalk');
const resolve = require('resolve');
const argv = require('optimist').argv;

const NODE_ENV = process.env.NODE_ENV;
const CONFIG_BASEDIR = process.env.CONFIG_BASEDIR || process.env.NODE_CONFIG_BASEDIR;
const CONFIG_DIR = process.env.CONFIG_DIR || process.env.NODE_CONFIG_DIR;
const CONFIG = _.assign({}, JSON.parse(process.env.CONFIG || process.env.NODE_CONFIG || '{}'), _.omit(argv, '_', '$0'));
const parent = module.parent;
if(!parent){
  throw new TypeError('config-light shoule be call in yourself module.');
}
const require_from = path.dirname(parent.filename);

module.exports = function configLite(options) {
  let config = {};
  options = options || {};
  const opt = {
    filename: NODE_ENV || options.filename || 'default',
    config_basedir: CONFIG_BASEDIR || options.config_basedir||require_from,
    config_dir: CONFIG_DIR || options.config_dir || 'config',
  };

  if (opt.filename !== 'default') {
    config = loadConfigFile(opt.filename, opt);
  }
  config = _.assign({}, loadConfigFile('default', opt), config);
  return _.assign({}, config, options.config, CONFIG);
};

function loadConfigFile(filename, opt) {
  try {
    const filepath = resolve.sync(filename, {
      basedir: opt.config_basedir,
      extensions: ['.js', '.json', '.node', '.yaml', '.yml', '.toml'],
      moduleDirectory: opt.config_dir,
    });
    if (/\.ya?ml$/.test(filepath)) {
      return require('js-yaml').safeLoad(fs.readFileSync(filepath, 'utf8'));
    } else if (/\.toml$/.test(filepath)) {
      return require('toml').parse(fs.readFileSync(filepath, 'utf8'));
    } else {
      return require(filepath);
    }
  } catch (err) {
    console.error(chalk.red('config-lite load ' + filename + ' failed.'));
    console.error(chalk.red(err.stack));
  }
}
