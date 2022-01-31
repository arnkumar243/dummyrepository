var updateUrl = function(url, args, id) {
    
    switch(id) {
        case 'alert-list': {
            //url = url + '/cdep/promotheus/?uri=/api/v1/query?query=ALERTS{alertstate="firing"'
            url = url + '/integration/rest/external/v1/cdep/promotheus/?uri=/api/v1/query?query=ALERTS{alertstate="firing"'
            url = args.options.solutionName ? url + `,solution="${args.options.solutionName}"`: url;
            url = args.options.stageName ? url + `,stage="${args.options.stageName}"`: url;
            url = args.options.alertName ? url + `,alertname="${args.options.alertName}"`: url;
            url = args.options.runtime ? url + `,product="${args.options.runtime}"`: url;
            url = args.options.severity ? url + `,severity="${args.options.severity}"`: url;
            url = url + '}';

            break;
        }
    }

    return url;
}

module.exports = {
    updateUrl
}