var stageService = require('./../../utils/stages');
var loader = require('./../../utils/loader');
var httpService = require('./../../utils/http');


var SessionInfo = require('./../../sessionInfo');
var sessionInfo = new SessionInfo();

var listSolution = function(args, session, callback) {

    var obj = {
        session: session,
        args: args,
        callback: callback
    }

    var stageName = stageService.getStageIDFromName(args.currentStage);
    var previousStageId = stageService.getStageIDFromName(args.previousStage);

    args.currentStage = stageName;
    args.previousStage = previousStageId;

    httpService.request(undefined, `/integration/rest/external/v1/cdep/solutions?stageName=${stageName}&previousStage=${previousStageId}`, configureSolution, listSolutionsError, obj);

}

var configureSolution = function(response, isSuccess, object) {
    loader.hideLoader();

    let solutionInfo;

    if(response.integration && response.integration.serviceData && response.integration.serviceData.notConfiguredSolutions && response.integration.serviceData.notConfiguredSolutions.length > 0) {
        response.integration.serviceData.notConfiguredSolutions.forEach(function(solution) {
            if(solution.solutionName == object.args.solutionName) {
                solutionInfo = solution;
            }
        })
    } else {
        object.session.log('All Solutions are Configured.');
        sessionInfo.getInstance().invokeCallbackIfInteractiveMode(object.callback());
    }  
    
    // If solution info is not set then solution does not exists in previous stage or its already configured
    if(solutionInfo) {

        solutionInfo.productDefinitions.IS.forEach(is => {
            if(is.labels) {
                is.labels.stage = object.args.currentStage;
            }
            if(is.landscapeRegistry) {
                is.landscapeRegistry.stage = object.args.currentStage;
            }
            if(is.replicaCount == 1) {
                is.isClustered = false;
                is.clusterType = null;
            }
            
        })

        let configureInput = {
            "integration": {
                "serviceData": {
                    solutionInfo
                }
            }
        }
        httpService.request(configureInput, `/integration/rest/external/v1/cdep/solutions/${object.args.solutionName}?previousStage=${object.args.previousStage}`, configureView, configureError, object);
    } else {
        object.session.log(`Solution with name ${object.args.solutionName} does not exits in previous stage or its already configured in current stage.`);
        sessionInfo.getInstance().invokeCallbackIfInteractiveMode(object.callback());
    }
}

var listSolutionsError = function(response, isSuccess, object) {

    object.session.log(response.error);

}

var configureSolutionError = function(response, isSuccess, object) {

}

var configureView = function(response, isSuccess, object) {
    console.log(JSON.stringify(response));
}

var configureError = function(response, isSuccess, object) {
    console.log(JSON.stringify(response));
}

var initialize = function(vorpal) {
    vorpal
        .command('solution configure <solutionName> <previousStage> <currentStage>')
        .description('Configures a Solution in Test, PreLive & Live stages.')
        .action(function(args, callback) {
            loader.showLoader('Retrieving Solutions');
            var session = this;
            listSolution(args, session, callback);
        });

}

module.exports = {
    initialize
}