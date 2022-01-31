var commonService = require('./../../utils/common');
var httpService = require('./../../utils/http');

var initialize = function(vorpal) {

    vorpal
        .command('alert list')
        .option('--solutionName <solutionName>', 'Name of the Solution')
        .option('--stageName <stageName>', "Allowed stage names are development, test, preLive, live")
        .option('--alertName <alertName>', "Alert name to filter")
        .option('--runtime <runtime>', "Allowed Runtime types are IS(Integration Server), UM(Universal Messaging), TC(Terracotta)")
        .option('--severity <severity>', "Allowed values are info, warning, critical")
        .option('--view <view>', 'Defaults table view. Enter --view json for JSON view.')
        .description('Lists all the Alerts.')
        .action(function(args, callback) {
            //loader.showLoader("Retrieving Alerts");
            var session = this;
            httpService.makeRequest('alerts', 'alert-list', args, this, callback);
        })

}

module.exports = {
    initialize
}