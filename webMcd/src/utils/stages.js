

var getDisplayNameFromStageID = function(stageID) {
    switch(stageID) {
        case 'stage00': return 'Development';
        case 'stage01': return 'Test';
        case 'stage02': return 'Pre Live';
        case 'stage99': return 'Live';
        default: return undefined;
    }
}

var getStageNameFromID = function(stageID) {
    switch(stageID) {
        case 'stage00': return 'development';
        case 'stage01': return 'test';
        case 'stage02': return 'preLive';
        case 'stage99': return 'live';   
        default: return undefined; 
    }
}

var getStageIDFromName = function(stageName) {
    if(stageName.toUpperCase() == 'DEVELOPMENT' || stageName.toUpperCase() == "DEV") {
        return 'stage00';
    } else if(stageName.toUpperCase() == 'TEST') {
        return 'stage01';
    } else if(stageName.toUpperCase() == 'PRELIVE') {
        return 'stage02';
    } else if(stageName.toUpperCase() == 'LIVE') {
        return 'stage99';
    } else {
        throw 'Enter a valid Stage Name. Valid stage names are Development, Test, Live, PreLive.'
    }
}

var getPreviousStageId = function(stageID) {
    switch(stageID) {
        case 'stage01': return 'stage00';
        case 'stage02': return 'stage01';
        case 'stage99': return 'stage02';
        default: return undefined; 
    }
}

module.exports = {
    getDisplayNameFromStageID,
    getStageNameFromID,
    getStageIDFromName,
    getPreviousStageId
}