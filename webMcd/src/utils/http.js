const requestPromise = require('request-promise');
const chalk = require('chalk')
const {JSONPath} = require('jsonpath-plus');

var urlService = require('./url');
var commonService = require('./common');
var SessionInfo = require('./../sessionInfo');
var view = require('./view');
var stageService = require('./stages');
var loader = require('./loader');

var sessionInfo = new SessionInfo();

var getHttpRequestMetadata = () => {
    var credentials = sessionInfo.getInstance().getUserName() + ':' + sessionInfo.getInstance().getPassword();
    var authorizationHeader = Buffer.from(credentials).toString('base64');
    var output = {
        uri: sessionInfo.getInstance().getURL(),
        headers: {
            'Authorization': 'Basic ' + authorizationHeader,
            'Accept': 'application/json'
        },
        json: true
    }
    return output;
}

var getHttpRequestMetadataForPost = function(body) {

    var output = getHttpRequestMetadata();
    output.method = 'POST';
    output.headers['Content-Type'] = "application/json";

    return output;
}

var request = function(requestBody, url, callback, callbackError, callbackObject) {
    
    let object = callbackObject;
    var requestDetails = requestBody != undefined ? getHttpRequestMetadataForPost(requestBody) : getHttpRequestMetadata();
    if(url) {
        requestDetails.uri = requestDetails.uri + url;
    }
    
    requestPromise(requestDetails)
        .then(function(response) {
            callback(response, true, object);
        })
        .catch(function(error) {
            callbackError(error, false, object);
        })
}

var makeRequest = (objectName, id, args, session, callback) => {

    var commandDetails = commonService.getCommand(objectName, id);
    if(!validateAndTransformArguments(args, commandDetails, session)) {
        callback();
        return; 
    }
    var requestDetails = getHttpRequestMetadata();

    try {

        requestDetails.method = commandDetails['method'];

        let url = requestDetails.uri + commandDetails['url'];
        url = addURIParameters(commandDetails, args, url);
        url = addQueryParameters(commandDetails, args, url);
        requestDetails.uri = urlService.updateUrl(url, args, id);

        loader.showLoader(commandDetails.loaderText);

        requestPromise(requestDetails)
            .then(function(response) {
                loader.hideLoader();
                view.viewOutput(objectName, id, args, response, session, callback)
            })
            .catch(function(error) {
                
                loader.hideLoader();

                if(error.error) {
                    let errorPath = commandDetails.error && commandDetails.error.path ? commandDetails.error.path : undefined;
                    if(commandDetails.error.defaultMessage) {
                        session.log(`${chalk.red(commandDetails.error.defaultMessage)}`);
                    } else if(errorPath && errorPath != undefined) {
                        var result = JSONPath({
                            path: errorPath,
                            json: error.error
                        });
                        session.log(`${chalk.red(result[0])}`);
                    } else {
                        session.log(error.error);
                    }

                } else {
                    session.log(error);
                }
                if(sessionInfo.getInstance().getInteractiveMode()) {
                    callback();
                } else {
                    process.exit(1);
                }
            })

    } catch(error) {
        session.log(`${chalk.red(error)}`);
        if(sessionInfo.getInstance().getInteractiveMode()) {
            callback();
        }
    }

}

var validateAndTransformArguments = function(args, object, session) {
    let isArgumentsValid = true;
    if(object.options && object.options.length > 0) {
        object.options.forEach(option => {
            var value = args.options[option.name] != undefined ? args.options[option.name] : args[option.name];
            if(value) {
                if(option.allowedValues) {
                    if(!option.allowedValues.includes(value)) {
                        session.log(`Enter a valid value for ${option.name}. Valid values are ${option.allowedValues}`);
                        isArgumentsValid = false;
                    }
                }
                if(option.transform) {
                    args.options[option.name] = option.transform[value] ? option.transform[value] : value;
                }
            }
        })
    }
    return isArgumentsValid;
}

var checkVersionCompatibility = function(cliVersion, callback, arguments) {

    let args = arguments;
    var requestDetails = getHttpRequestMetadata();
    requestDetails.uri = requestDetails.uri + `/integration/rest/external/v1/cliVersion?currentVersion=${cliVersion}`;

    requestPromise(requestDetails)
        .then(function(response) {
            if(response.integration.serviceData.versionCompatible) {
                callback(args);
            } else {
                console.log(`${chalk.red('Your Webmethods Cloud Deployment CLI version is deprecated. Update your CLI version and try again.')}`);
                process.exit(1);
            }
        })
        .catch(function(error) {
            console.log(`${chalk.red('Invalid Integration Cloud URL, UserName & Password.')}`);
            process.exit(1);
        })
}


var addURIParameters = (commandDetails, args, url) => {

    if(!commandDetails.inputs) {
        return url;
    }

    // Replace all the URL params
    var urlParams = commandDetails.inputs.filter(param => {
        
        if(param.type == 'uri') {
            return true;
        }
        return false;
    });

    if(urlParams && urlParams.length > 0) {
        urlParams.forEach(function(param) {

            let paramName = param.paramName ? param.paramName : param.name;
            let argName = param.name;

            var value = args[argName];
            if(!value) {
                value = args.options[argName];
            }
            if(param.isStageID) {
                value = stageService.getStageIDFromName(value);
            }

            if(!value) {
                throw argName + " is missing or invalid. Check help for more information.";
            }

            if(param.changeValue) {
                value = param.changeValue[value] != undefined ? param.changeValue[value] : value; 
            }

            url = url.replace('{'+paramName+'}', value);
        })
    }

    return url;
}

var addQueryParameters = (commandDetails, args, url) => {

    if(!commandDetails.inputs) {
        return url;
    }

    // Add query parameters if exists
    var queryParams = commandDetails.inputs.filter(param => {

        if(param.type == 'query') {
            return true;
        }
        return false;
    });

    if(queryParams && queryParams.length > 0) {
        let paramsToBeAdded = [];
        queryParams.forEach(param => {

            let paramName = param.paramName ? param.paramName : param.name;
            let argName = param.name;

            let value = args[argName];
            if(!value) {
                value = args.options[argName];
            }
            if(param.isStageID) {
                value = stageService.getStageIDFromName(value);
            }
            if(!value) {
                throw argName + " is missing or invalid. Check help for more information.";
            }

            if(param.changeValue) {
                value = param.changeValue[value] != undefined ? param.changeValue[value] : value; 
            }

            paramsToBeAdded.push(paramName + '=' + value);
        });

        if(paramsToBeAdded.length > 0) {
            url = url + '?';
            for(var i = 0; i < paramsToBeAdded.length; i++) {
                if(i > 0) {
                    url = url + '&'
                }
                url = url + paramsToBeAdded[i];
            }
        }
    }
    return url;
}


module.exports = {
    getHttpRequestMetadata,
    getHttpRequestMetadataForPost,
    makeRequest,
    request,
    checkVersionCompatibility
}