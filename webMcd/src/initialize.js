const vorpal = require('vorpal')();
const chalk = require('chalk')

var commonService = require('./utils/common');
var httpService = require('./utils/http');
var SessionInfo = require('./sessionInfo');

var info = new SessionInfo();
var currentCliVersion = require('./../package.json').version;
var runtimeCommands = require('./../src/commands/runtime/services');
var solutionCreate = require('./../src/commands/solution/create');
var solutionConfigure = require('./../src/commands/solution/configure');
var alertCommands = require('./../src/commands/alerts/services');

var initializeApplication = function() {

    const args = require('minimist')(process.argv.slice(2));
    const isInteractiveMode = args.mode && args.mode == 'interactive' ? true : false;

    // Disabling the Certificate validation
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

    let url;
    let userName;
    let password; 

    console.log('\n');
    if(args.userName && args.password && args.url) {
        console.log('Credentials are read from Runtime Arguments');
        url = args.url;
        userName = args.userName;
        password = args.password;
        
    } else {
        var profileInfo = commonService.getProfile(args.profile);
        url = profileInfo.url;
        userName = profileInfo.userName;
        if(profileInfo.password == undefined || profileInfo.password.length == 0) {
            console.log('Password is not specified in a config file. Set the password or provide it as an runtime argument --password <password>');
        }
        password = profileInfo.password != undefined ? profileInfo.password : args.password;
    }
    //else if(process.env.WMCD_URL && process.env.WMCD_USER_NAME && !args.profile) {
    //    console.log('Credentials are read from Environment Variables');
    //    url = process.env.WMCD_URL;
    //    userName = process.env.WMCD_USER_NAME;
    //    if(process.env.WMCD_PASSWORD == undefined || process.env.WMCD_PASSWORD.length == 0) {
    //        console.log('Password is not present in set in an environment variable WMCD_PASSWORD. Set the password or provide it as an runtime argument --password <password>');
    //    }
    //    password = process.env.WMCD_PASSWORD != undefined ? process.env.WMCD_PASSWORD : args.password; 
    //} 

    if(!userName) {
        console.log("Failed to Connect. UserName is Missing.");
        process.exit(1);
    }

    if(!password) {
        console.log("Unable to Connect to Integration Cloud. Password is Missing.");
        process.exit(1);
    }

    if(!url) {
        console.log("Unable to Connect to Integration Cloud. URL is Missing.");
        process.exit(1);
    }

    console.log('Connecting to ' + url);
    console.log('Signing in as ' + userName);

    info.setInstance(url, userName, password, isInteractiveMode);

    let array = [];
    if(!isInteractiveMode) {
        for(let i = 0; i < process.argv.length; i++) {
            if(process.argv[i] && (process.argv[i].startsWith('--mode') || process.argv[i].startsWith('--profile') || process.argv[i].startsWith('--url') || process.argv[i].startsWith('--userName') || process.argv[i].startsWith('--password'))) {
                i = i + 1
            } else {
                array.push(process.argv[i]);
            }
        }
    } else {
        array.push(process.argv[0]);
        array.push(process.argv[1]);
    }


    process.argv = array;
    if(process.argv.length <= 2 && !isInteractiveMode) {
        console.log('No Commands specified');
    }

    // Removing the application arguments before parsing it.
    var arguments = process.argv.filter(element => {
        return element ? true : false;
    });

    httpService.checkVersionCompatibility(currentCliVersion, initializeCommands, arguments);

};


var initializeCommands = function(arguments) {

    addClearCommandIfInteractiveMode();

    var commandObject = commonService.getCommands();
    alertCommands.initialize(vorpal);

    for(let object in commandObject) {
        switch(object) {
            case 'solution': {
                //solutionConfigure.initialize(vorpal);
                solutionCreate.initialize(vorpal);
                break;
            }
            case 'runtime': runtimeCommands.initialize(vorpal);break;
        }

        commandObject[object].forEach(function(element) {
            if(element.command) {
                vorpal
                    .command(element.command)
                    .description(element.description)
                    .option('--view <viewType>', 'json or table. Defaults table view.')
                    .action(function(args, callback) {
                        httpService.makeRequest(object, element.id, args, this, callback);
                    })
            }
        })
    }

    vorpal.parse(arguments);

    if(info.getInstance().getInteractiveMode()) {
        printTitleForInteractiveMode();
        vorpal
            .delimiter('wmcd_cli~$')
            .show();
    }
}

var addClearCommandIfInteractiveMode = function() {
    if(info.getInstance().getInteractiveMode()) {
        vorpal
            .command('clear', 'Clears the console in interactive mode.')
            .action(function(args, cbk) {
                let blank = '';
                for (var i = 0; i < process.stdout.rows; ++i) {
                  blank += '\n';
                }
                vorpal.ui.redraw(blank);
                vorpal.ui.redraw('');
                cbk();
            });
    }
}


var printTitleForInteractiveMode = function() {
        
        let title = 
            "              _     __  __      _   _               _      ____ _                  _ "            + '\n' + 
            "__      _____| |__ |  \\/  | ___| |_| |__   ___   __| |___ / ___| | ___  _   _   __| |"           + '\n' +
            "\\ \\ /\\ / / _ \\ '_ \\| |\\/| |/ _ \\ __| '_ \\ / _ \\ / _` / __| |   | |/ _ \\| | | | / _` |"  + '\n' + 
            " \\ V  V /  __/ |_) | |  | |  __/ |_| | | | (_) | (_| \\__ \\ |___| | (_) | |_| || (_| |"         + '\n' + 
            "  \\_/\\_/ \\___|_.__/|_|  |_|\\___|\\__|_| |_|\\___/ \\__,_|___/\\____|_|\\___/ \\__,_| \\__,_|" + '\n' + 
            "                                                                                       CLI v1.0.0" + '\n';
    
        let copyRight = 'Copyright © 2014-2019 Software AG, Darmstadt, Germany and/or Software AG USA Inc., Reston, VA, USA, and/or its subsidiaries and/or its affiliates and/or their licensors.';
    
    
        console.log();
    
        console.log(`${chalk.cyan(title)}`);
        console.log(`${chalk.cyan(copyRight)}`);
    
        console.log(`${chalk.green('\nConnected to webMethods Cloud Deployment... \n')}`);
    }


initializeApplication();