const ora = require('ora');
const chalk = require('chalk')
const requestPromise = require('request-promise');
var PropertiesReader = require('properties-reader');

const loader = require('./../../utils/loader');
var httpService = require('./../../utils/http');
var SessionInfo = require('./../../sessionInfo');
var sessionInfo = new SessionInfo();

var getCompositesAndPromoteAssets = function(args, session, callback, assetType) {
    loader.showLoader('Retrieving assets');
    let url = `/integration/rest/external/v1/cdep/binaryAssets/solutions/${args.fromSolutionName}/nodes/${args.fromNodeName}?stageName=${args.fromStageName}`;

    var requestDetails = httpService.getHttpRequestMetadata();
    requestDetails.uri = requestDetails.uri + url;

    requestPromise(requestDetails)
        .then(function(response) {
            loader.hideLoader();
            if(response.integration.cicdBean.acdlComposite[assetType] == undefined || response.integration.cicdBean.acdlComposite[assetType].length == 0) {
                let msg = assetType == 'CC' ? 'No Configuration is available to Promote.' : 'No Packages are available to promote.';
                session.log(msg);
                if(sessionInfo.getInstance().getInteractiveMode()) {
                    callback();
                }
            } else {

                assetType == 'CC' ? delete response.integration.cicdBean.acdlComposite.IS : delete response.integration.cicdBean.acdlComposite.CC;
                response.integration.cicdBean.commitMessage = 'Promoting Assets through CLI.';
                
                performVariableSubstitution(response, args, assetType);

                promoteAssets(args, response, session, callback);
            }            
        })
        .catch(function(error) {
            loader.hideLoader();
            if(!error.error) {
                session.log(error);
            } else {
                let errorMessage = error.error && error.error.integration && error.error.integration.message && error.error.integration.message.description ? error.error.integration.message.description : "Promotion failed unable to retrieve the composites.";
                session.log('Unable to get the composites. ' + errorMessage);
            }
            
            if(sessionInfo.getInstance().getInteractiveMode()) {
                callback();
            } else {
                process.exit(1);
            }
        })
}

var promoteAssets = function(args, requestBody, session, callback) {

    loader.showLoader('Promoting Assets');

    var requestDetails = httpService.getHttpRequestMetadata();
    let url;

    if(args.toSolutionName && args.toNodeName) {
        url = requestDetails.uri + `/integration/rest/external/v1/cdep/binaryAssets/solutions/${args.toSolutionName}/nodes/${args.toNodeName}?action=promote&sourceSolution=${args.fromSolutionName}&sourcenodeName=${args.fromNodeName}`;
    } else {
        url = requestDetails.uri + `/integration/rest/external/v1/cdep/binaryAssets/solutions/${args.fromSolutionName}/nodes/${args.fromNodeName}?action=promote`;
    }

    requestDetails.uri = url;
    requestDetails.method = 'POST';
    requestDetails.body = requestBody;
    requestDetails.headers['Content-Type'] = 'application/json';

    requestPromise(requestDetails)
        .then(function(response) {
            loader.hideLoader();
            session.log(`${chalk.blue('Deployment Result: ')}` + response.integration.serviceData.deploymentResult);
            if(sessionInfo.getInstance().getInteractiveMode()) {
                callback();
            }
        })
        .catch(function(error) {
            loader.hideLoader();
            let msg = "Error occured while promoting assets.";
            if(error.error && error.error.integration && error.error.integration.message && error.error.integration.message.description) {
                msg = msg + ' ' + error.error.integration.message.description;
            } else {
                msg = msg + ' ' + JSON.stringify(error.error);
            }
            
            session.log(msg);
            if(sessionInfo.getInstance().getInteractiveMode()) {
                callback();
            } else {
                process.exit(1);
            }
        })

}

function performVariableSubstitution(body, arg, assetType) {
    
    loader.showLoader('Performing variable substitution');
    
    var assets = body;

    if(arg.options.include && arg.options.include.length > 0 && arg.options.exclude && arg.options.exclude.length > 0) {
        throw "Provider either include or exclude packages list";
    }

    if(arg.options.include && arg.options.include.length > 0) {
        includeOrExcludeComposites(arg.options.include.split(","), assets, 'include', assetType);
    }

    if(arg.options.exclude && arg.options.exclude.length > 0) {
        includeOrExcludeComposites(arg.options.exclude.split(","), assets, 'exclude', assetType);
    }

    if(arg.options.propFile && arg.options.propFile.length > 0) {
        performVariableSubstitutionFromPropertiesFile(arg.options.propFile, assetType, body);
    }

    loader.hideLoader();
}

function performVariableSubstitutionFromPropertiesFile(propFile, nodeType, requestBody) {
    var properties = PropertiesReader(propFile);
    properties.each((key, value) => {
        let keys = key.split('/');
        if(keys.length == 2) {
            let propertyName = keys[0];
            let compositeName = keys[1];
            requestBody.integration.cicdBean.acdlComposite[nodeType].forEach(composite => {
                if(compositeName == '*' || compositeName == composite.name) {
                    composite.properties.forEach(property => {
                        if(propertyName == '*' || propertyName == property.name) {
                            let values = [];
                            values.push(value);
                            property.values = values;
                        }
                    })
                }
            })
        } else if(keys.length == 3) {
            let propertyName = keys[0];
            let compositeName = keys[1];
            let assetName = keys[2];
            requestBody.integration.cicdBean.acdlComposite[nodeType].forEach(composite => {
                if(compositeName == '*' || compositeName == composite.name) {
                    composite.assets.forEach(asset => {
                        if(assetName == '*' || assetName == asset.name) {
                            asset.properties.forEach(property => {
                                if(propertyName == '*' || propertyName == property.name) {
                                    let values = [];
                                    values.push(value);
                                    property.values = values;
                                }
                            })
                        }
                    });
                }
            })
        }
    })
}

function includeOrExcludeComposites(composites, assets, option, assetType) {
    let output = [];

    for(let i = 0; i < assets.integration.cicdBean.acdlComposite[assetType].length; i++) {
        if(composites.includes(assets.integration.cicdBean.acdlComposite[assetType][i].name) && option == 'include') {
            output.push(assets.integration.cicdBean.acdlComposite[assetType][i]);
        } 

        if(!composites.includes(assets.integration.cicdBean.acdlComposite[assetType][i].name) && option == 'exclude') {
            output.push(assets.integration.cicdBean.acdlComposite[assetType][i]);
        } 
    }

    if(output.length == 0) {
        throw 'Promote list does not contain any composites. Update your include or exclude option to allow one or more composites to promote.';
    }

    assets.integration.cicdBean.acdlComposite[assetType] = output;
}


var initialize = function(vorpal) {
    vorpal
        .command('runtime promote-configuration <fromSolutionName> <fromNodeName> <fromStageName> [toSolutionName] [toNodeName]')
        .option('--propFile [fileName]', 'Properties file')
        .description('Promote configurations from one stage to another')
        .action(function(args, callback) {
            var session = this;
            getCompositesAndPromoteAssets(args, session, callback, 'CC');
        })

    vorpal
        .command('runtime promote-packages <fromSolutionName> <fromNodeName> <fromStageName> [toSolutionName] [toNodeName]')
        .option('--include [packageNames]', 'Promotes only the specified packages')
        .option('--exclude [packageNames]', 'Exclude promotion of specified packages')
        .option('--propFile [fileName]', 'Properties file')
        .description('Promote IS packages from one stage to another')
        .action(function(args, callback) {
            var session = this;
            getCompositesAndPromoteAssets(args, session, callback, 'IS');
        })
}

module.exports = {
    initialize,
    getCompositesAndPromoteAssets
}