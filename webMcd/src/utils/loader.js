const ora = require('ora');
const chalk = require('chalk')

var spinner;

// To show & hide Loaders
var showLoader = function(text) {
    spinner = ora({'text': `${chalk.blue(text)}`, 'spinner': `dots2`}).start();
    spinner.color = 'blue';
}

var changeLoaderText = function(text) {
    if(spinner.isSpinning) {
        spinner.text = `${chalk.blue(text)}`;
    }
}

var hideLoader = function() {
    if(spinner && spinner.isSpinning) {
        spinner.stop();
    }
}

module.exports = {
    showLoader,
    changeLoaderText,
    hideLoader
}