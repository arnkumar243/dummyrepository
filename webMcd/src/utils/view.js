var Table = require('cli-table3');

const chalk = require('chalk')
const {JSONPath} = require('jsonpath-plus');
const colorize = require('json-colorizer');

var commonService = require('./common');
var stageService = require('./stages');
var SessionInfo = require('./../sessionInfo');

var sessionInfo = new SessionInfo();

var viewOutput = function(objectName, id, args, response, session, callback) {
    var commandDetails = commonService.getCommand(objectName, id);

    session.log();

    if(commandDetails.view.default) {
        let path = commandDetails.view.default.path;

        var result = JSONPath({
            path: path,
            json: response
        });

        let value = result[0];

        if(commandDetails.view.default.transform) {
            value = commandDetails.view.default.transform[value];
        }
        commandDetails.view.default.name + ' ' + value
        session.log(`${chalk.blue(commandDetails.view.default.name + ' ' + value)}`);
    }

    if(args.options && args.options.view && args.options.view == 'json') {
        jsonView(commandDetails, args, response, session);
    } else {
        tableView(commandDetails, args, response, session);
    }

    if(sessionInfo.getInstance().getInteractiveMode()) {
        callback();
    }
}

var tableView = function(commandDetails, args, response, session) {

    var showTables = false;
    var tablesDisplayed = false;
    var tablesView = commandDetails.view.table;

    tablesView.forEach(function(view) {
        var result = JSONPath({
            path: view.path,
            json: response
        });

        // Adding Table Headers
        let array = [];
        view.header.forEach(function(head) {
            array.push(`${chalk.blue.bold(head)}`);
        });
        var table = new Table({
            head: array
        });

        if(view.isArray) {
            result = result[0];
        }

        if(result && result.length > 0) {

            if(view.isStringArray) {
                result.forEach(item => {
                    showTables = true;
                    let array = []
                    array.push(item);
                    table.push(array);
                }) 
                if(showTables) {
                    session.log(table.toString());
                    tablesDisplayed = true;
                }
                return;
            }

            if(view.isResponseJSONString) {
                let jsonResponse = JSON.parse(result[0]);
                if(view.isResponseJSONArray && jsonResponse[view.jsonPath]) {
                    result = jsonResponse[view.jsonPath];
                } else {
                    result = [];
                    if(Object.keys(jsonResponse).length > 0) {
                        result.push(jsonResponse);
                    }
                }
            }


            // Adding Table body
            result.forEach(function(item) {
                let body = [];

                view.body.forEach(bodyElement => {

                    var valuesArray = JSONPath({
                        path: bodyElement.path,
                        json: item
                    });

                    let value = valuesArray[0];
                    let isDate = bodyElement.isDate;
                    if(isDate) {
                        let date = new Date(parseInt(value) * 1000);
                        value = date.toISOString();
                        value = value.split("T").join("\n");
                    }

                    let isBoolean = bodyElement.isBoolean;
                    if(isBoolean) {
                        if(value) {
                            value = `${chalk.green(bodyElement['trueValue'])}`
                        } else {
                            value = `${chalk.green(bodyElement['falseValue'])}`
                        }
                    }

                    if(bodyElement.transform) {
                        let tempValue = value;
                        value = bodyElement.transform[value];
                        if(!value) {
                            value = tempValue;
                        }
                    }

                    let type = bodyElement.type;
                    if(type == 'stageId') {
                        value = stageService.getDisplayNameFromStageID(value);
                    }

                    if(bodyElement.color) {
                        let color = bodyElement.color[value];
                        switch(color) {
                            case 'red': value = `${chalk.red(value)}`; break;
                            case 'green': value = `${chalk.green(value)}`; break;
                        }
                    }

                    showTables = true;
                    body.push(value);
                });

                table.push(body);
            });
        }

        if(showTables) {
            tablesDisplayed = true;
            session.log(`${chalk.yellow(view.title)}`);
            session.log(table.toString());
        }
        showTables = false;
    });

    if(!tablesDisplayed) {
        session.log(`${chalk.blue('No Items to Display.')}`);
    }
}

var jsonView = function(commandDetails, args, response, session) {

    let path = commandDetails.view.json.path;

    var result = JSONPath({
        path: path,
        json: response
    });

    var jsonOutput;
    if(commandDetails.view.json.isJsonString) {
        let outputJson = JSON.parse(result[0]);
        removeNullFields(outputJson);
        jsonOutput = JSON.stringify(outputJson, null, 2);
    } else {
        removeNullFields(result[0]);
        jsonOutput = JSON.stringify(result[0], null, 2);
    }

    session.log(colorize(jsonOutput));
}

var removeNullFields = function(obj) {
    if(obj) {
        Object.keys(obj).forEach(key => {
            if(obj[key] == null) {
                delete obj[key];
            } else {
                let type = typeof obj[key];
                let value = obj[key];
                if(type == 'object') {
                    if(value instanceof Array) {
                        value.forEach(ele => {
                            let eleType = typeof ele;
                            if(ele && eleType == 'object' && !(eleType instanceof Array) && Object.keys(ele).length > 0) {
                                removeNullFields(ele);
                            }
                        })
                    } else if(Object.keys(value).length > 0) {
                        removeNullFields(value);
                    }
                }
            }
        });
    }
}


module.exports = {
    viewOutput
}