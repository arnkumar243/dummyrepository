var path = require('path');
const requestPromise = require('request-promise');
var request = require('request');
const chalk = require('chalk');

var fileService = require('./../../utils/common');
var loader = require('./../../utils/loader');
var httpService = require('./../../utils/http');
var stageService = require('./../../utils/stages');
var SessionInfo = require('./../../sessionInfo');
var stageService = require('./../../utils/stages');
var sessionInfo = new SessionInfo();

var getAvailableVersions = function(args, session, callback) {

    var obj = {
        session: session,
        args: args,
        callback: callback
    }

    if(args.options.inputFile) {
        httpService.request(undefined, '/integration/rest/external/v1/cdep/solutions/product/versions', createSolution, createSolution, obj);
    } else {
        loader.hideLoader();
        session.log(`${chalk.red('Input file name is missing. Enter a input file location --inputFile.')}`);
        if(sessionInfo.getInstance().getInteractiveMode()) {
            callback();
        }
    }
    
}

var createSolution = function(response, isSuccess, object) {

    loader.hideLoader();

    let args = object.args;
    let input = fileService.getFile(args.options.inputFile);
    let invalidInput = false;

    let solutionName = input.integration && input.integration.landscapeDefinition && input.integration.landscapeDefinition.solutionName ? input.integration.landscapeDefinition.solutionName : undefined;
    if(!solutionName) {
        invalidInput = true;
        object.session.log(`${chalk.red('Solution Name is missing in the provided input file. Provide a valid solution Name.')}`);
    }

    let solutionType = input.integration && input.integration.landscapeDefinition && input.integration.landscapeDefinition.solutionType ? input.integration.landscapeDefinition.solutionType : undefined;
    if(!solutionType || (solutionType != 1 && solutionType != 2 && solutionType != 3)) {
        invalidInput = true;
        object.session.log(`${chalk.red('Solution Type is missing or invalid. Valid solution types are 1, 2, 3')}`);
    }

    if(solutionType && input.integration && input.integration.landscapeDefinition && input.integration.landscapeDefinition.productDefinitions && input.integration.landscapeDefinition.productDefinitions.IS) {
        switch(solutionType) {
            case 1 : {
                if(input.integration.landscapeDefinition && input.integration.landscapeDefinition.productDefinitions.IS.length == 1) {
                    input.integration.landscapeDefinition.productDefinitions.IS[0]['productType']='IS';
                    input.integration.landscapeDefinition.productDefinitions.IS[0]['id']='IS_1';
					
					if(validateClustering(input.integration.landscapeDefinition.productDefinitions.IS[0])){
						
						object.session.log(`${chalk.red('isClustered value should be true in the provided input file for clustered solution.')}`);
						
					    invalidInput = true;
					}
					if(validatePackages(input.integration.landscapeDefinition.productDefinitions.IS[0])){
						
						object.session.log(`${chalk.red('Packages should not be given for product version less than 10.4')}`);
						
						invalidInput = true;
					}
					
                    if(validateStatefulCluster(input.integration.landscapeDefinition.productDefinitions.IS[0])){
							
						  input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0]['productType']='TERRACOTTA';
						
                          input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0]['id']='TC_1';
						
					      validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0], invalidInput);
					
					}
                    validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.IS[0], invalidInput);
                    
                } else {
                    invalidInput =true;
                }
                break;
            }

            case 2 : {
                if(input.integration.landscapeDefinition && input.integration.landscapeDefinition.productDefinitions.IS && input.integration.landscapeDefinition.productDefinitions.IS.length == 1 &&
                    input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING && input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING.length ==1) {

                        input.integration.landscapeDefinition.productDefinitions.IS[0]['productType']='IS';
                        input.integration.landscapeDefinition.productDefinitions.IS[0]['id']='IS_1';

                        input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING[0]['productType']='UNIVERSALMESSAGING';
                        input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING[0]['id']='UM';

                        validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.IS[0], invalidInput);
                        validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING[0], invalidInput);
						
						
						if(validateClustering(input.integration.landscapeDefinition.productDefinitions.IS[0])){
						
						  object.session.log(`${chalk.red('isClustered value should be true in the provided input file for clustered solution.')}`);
						
					      invalidInput = true;
					    }
						
						if(validatePackages(input.integration.landscapeDefinition.productDefinitions.IS[0])){
						
						 object.session.log(`${chalk.red('Packages should not be given for product version less than 10.4')}`);
						
						 invalidInput = true;
					    }
						
						if(validateStatefulCluster(input.integration.landscapeDefinition.productDefinitions.IS[0])){
							
						  input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0]['productType']='TERRACOTTA';
						
                          input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0]['id']='TC_1';
						
					      validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0], invalidInput);
					
					    }

                } else {
                    invalidInput = true;
                }
                break;
            }

            case 3 : {

                if(input.integration.landscapeDefinition && input.integration.landscapeDefinition.productDefinitions.IS && input.integration.landscapeDefinition.productDefinitions.IS.length == 2 &&
                    input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING && input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING.length ==1) {

                        input.integration.landscapeDefinition.productDefinitions.IS[0]['productType']='IS';
                        input.integration.landscapeDefinition.productDefinitions.IS[0]['id']='IS_1';

                        input.integration.landscapeDefinition.productDefinitions.IS[1]['productType']='IS';
                        input.integration.landscapeDefinition.productDefinitions.IS[1]['id']='IS_2';

                        input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING[0]['productType']='UNIVERSALMESSAGING';
                        input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING[0]['id']='UM';

                        validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.IS[0], invalidInput);
                        validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.IS[1], invalidInput);
                        validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING[0], invalidInput);
						
						if(validatePackages(input.integration.landscapeDefinition.productDefinitions.IS[0])){
						
						 object.session.log(`${chalk.red('Packages should not be given for product version less than 10.4')}`);
						
						 invalidInput = true;
					    }
						
						if(validatePackages(input.integration.landscapeDefinition.productDefinitions.IS[1])){
						
						 object.session.log(`${chalk.red('Packages should not be given for product version less than 10.4')}`);
						
						 invalidInput = true;
					    }
						
						if(validateClustering(input.integration.landscapeDefinition.productDefinitions.IS[0])){
						
						  object.session.log(`${chalk.red('isClustered value should be true in the provided input file for clustered solution.')}`);
						
					      invalidInput = true;
					    }
						
						if(validateClustering(input.integration.landscapeDefinition.productDefinitions.IS[1])){
						
						  object.session.log(`${chalk.red('isClustered value should be true in the provided input file for clustered solution.')}`);
						
					      invalidInput = true;
					    }
						
						if(validateStatefulCluster(input.integration.landscapeDefinition.productDefinitions.IS[0])){
							
						  input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0]['productType']='TERRACOTTA';
						
                          input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0]['id']='TC_1';
						
					      validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[0], invalidInput);
					
					    }
						if(validateStatefulCluster(input.integration.landscapeDefinition.productDefinitions.IS[1])){
						
					      input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[1]['productType']='TERRACOTTA';
						
                          input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[1]['id']='TC_2';
						
					      validateCpuAndEnvPackages(input.integration.landscapeDefinition.productDefinitions.TERRACOTTA[1], invalidInput);
					
					    }

                } else {
                    invalidInput = true;
                }

                break;
            }
        }
    } else {
        invalidInput = true;
        object.session.log(`${chalk.red('Provided input file does not have any IS Configurations.')}`);
    }

	if(!invalidInput && addImageTagInfo(input, response)) {

        // Adding additional info
        input.integration["startDate"] = "";
        input.integration["runOnceType"] = "scheduledAt";
        input.integration["scheduleType"] = "runOnce";
		 
	    loader.showLoader('Creating Solution');
        let url = httpService.getHttpRequestMetadata().uri + `/integration/rest/external/v1/cdep/solutions/${solutionName}?currentStage=${args.options.stageName}`;
        let headers = httpService.getHttpRequestMetadata().headers;
        let formData = {
            serviceData: {
                value: JSON.stringify(input),
                options: {
                    filename: 'blob', 
                    contentType: 'application/json'
                }
            }
        }

        request.post({url:url, headers: headers, formData: formData}, function(err, httpResponse, body) {
            loader.hideLoader();
            if (err) {
                object.session.log(`${chalk.red('Unable to create solution .' + err.error)}`);
            } else if(body) {
                let obj = JSON.parse(body);
                if(obj.integration.message.code == -1) {
                    object.session.log(`${chalk.red(obj.integration.message.description)}`);
                } else {
                    object.session.log(`${chalk.green(obj.integration.message.description)}`);
                }
            }

            if(sessionInfo.getInstance().getInteractiveMode()) {
                object.callback();
            }
            
        });


    } else {

        let msg = invalidInput ? 'Provided input file is not valid.' : 'unable to retrieve Version Image Info. Check the version provided.';
        object.session.log(`${chalk.red(msg)}`);

        if(sessionInfo.getInstance().getInteractiveMode()) {
            object.callback();
        }
    }
}

var validateCpuAndEnvPackages = function(object, isValidInput) {
    if(!(object.resources && object.resources.limits && object.resources.limits.cpu)) {
        console.log(`${chalk.red('CPU details is Missing in the provided input file.')}`);
        isValidInput = true;
    }

    if(!(object.resources && object.resources.limits && object.resources.limits.memory)) {
        console.log(`${chalk.red('Memory is Missing in the provided input file.')}`);
        isValidInput = true;
    }

    if(!object.version) {
        console.log(`${chalk.red('Product version is Missing in the provided input file.')}`);
        isValidInput = true;
    }
}

var validateStatefulCluster = function(object) {
	
	return(object.clusterType == 'stateful')
}

var validateClustering = function(object) {
	
	return ((!object.isClustered || object.isClustered == null || object.isClustered == false) && (object.clusterType && object.clusterType != null)) 

}

var validatePackages = function(object) {
	
	return (object.version < 10.4 && object.env.packages.length>0) 

}

var addImageTagInfo = function(input, productInfo) {
    var productDetails = {};
    var is = [];
    var um = [];
    var terracotta = [];
    let isImageDetailsAdded = true;

    if(!productInfo || !productInfo.integration || !productInfo.integration.serviceData) {
        return false;
    }

    const productKeys = Object.keys(productInfo.integration.serviceData.products);
    productKeys.forEach(function(productKey) {
        let product = productInfo.integration.serviceData.products[productKey];
        const releaseKeys = Object.keys(product.releases);
        releaseKeys.forEach(function(releaseKey) {
            let release = product.releases[releaseKey];
            var obj = {};
            let releaseDate;
            obj.version = releaseKey;
            const minorVersionKeys = Object.keys(release.fixes);
            minorVersionKeys.forEach(function(minorVersionKey) {
                let fix = release.fixes[minorVersionKey];
                if(!releaseDate) {
                    obj.imageTag = fix.imageTag;
                    releaseDate = fix.releaseDate;
                } else {
                    obj.imageTag = fix.releaseDate > releaseDate ? fix.imageTag : obj.imageTag;
                }
            });

            switch(product.name) {
                case 'IS': is.push(obj); break;
                case 'UNIVERSALMESSAGING': um.push(obj); break;
                case 'TERRACOTTA': terracotta.push(obj); break;
            }
        })
        
    });

    let defaultFileName = path.join(__dirname, "/../../../resources/configurations/solutions_create_metadata.json");
    let metadata = fileService.getFile(defaultFileName);

    input.integration.landscapeDefinition.productDefinitions.IS.forEach(function(element) {
        let imageTag = getImageTag(element.version, is);
        if(!imageTag) {
            isImageDetailsAdded = false;
        } else {
            addAdditionalMetadata(metadata, input.integration.landscapeDefinition.solutionType, element.id, element);
            element['image']['tag'] = imageTag;
        }

    });

    if(input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING) {
        input.integration.landscapeDefinition.productDefinitions.UNIVERSALMESSAGING.forEach(function(element) {
            let imageTag = getImageTag(element.version, um);
            if(!imageTag) {
                isImageDetailsAdded = false;
            } else {
                addAdditionalMetadata(metadata, input.integration.landscapeDefinition.solutionType, element.id, element);
                element['image']['tag'] = imageTag;
            }

        });
    }
	
	if(input.integration.landscapeDefinition.productDefinitions.TERRACOTTA) {
        input.integration.landscapeDefinition.productDefinitions.TERRACOTTA.forEach(function(element) {
            let imageTag = getImageTag(element.version, terracotta);
            if(!imageTag) {
                isImageDetailsAdded = false;
            } else {
                addAdditionalMetadata(metadata, input.integration.landscapeDefinition.solutionType, element.id, element);
                element['image']['tag'] = imageTag;
            }

        });
    }
    
    return isImageDetailsAdded;

}

var addAdditionalMetadata = function(metadata, solutionType, id, input) {
    var object = metadata[solutionType][id];
    for(key in object) {
        input[key] = object[key];
    }
}

var getImageTag = function(version, product) {
    for(let i = 0; i < product.length; i++) {
        if(product[i].version == version) {
            return product[i].imageTag;
        }
    }
}

var createView = function(response, isSuccess, object) {
    loader.hideLoader();
    if(isSuccess) {
        object.session.log(`${chalk.green(response.integration.serviceData.message)}`);
    } else {
        object.session.log(`${chalk.red(response.error.integration.message.description)}`);
    }

    if(sessionInfo.getInstance().getInteractiveMode()) {
        object.callback();
    }
}

var initialize = function(vorpal) {

    vorpal
        .command('solution create <stageName>')
        .option('--inputFile <fileName>')
        .description('Create a Solution in given stage')
        .action(function(args, callback) {
			let stage;
			try {
				stage = stageService.getStageIDFromName(args.stageName);
				loader.showLoader("Retrieving Image details");
				var session = this;
				args.options.stageName = stage;
				getAvailableVersions(args, session, callback);
			} catch(err){
				this.log(`${chalk.red(err)}`);
				if(sessionInfo.getInstance().getInteractiveMode()) {
					callback();
				}
			}
			
            
        })

}

module.exports = {
    initialize
}