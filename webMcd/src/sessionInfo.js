class SessionInfo {
    
    constructor(url, userName, password, isInteractiveMode) {
        this.url = url;
        this.userName = userName;
        this.password = password;
        this.isInteractiveMode = isInteractiveMode;
    }

    getURL() {
        return this.url;
    }

    getUserName() {
        return this.userName;
    }

    getPassword() {
        return this.password;
    }

    getInteractiveMode() {
        return this.isInteractiveMode;
    }

    invokeCallbackIfInteractiveMode(callback) {
        if(this.isInteractiveMode) {
            callback();
        }
    }

}

class Singleton {

    constructor() {
    }

    setInstance(url, userName, password, isCLIMode) {
        if(!Singleton.instance) {
            Singleton.instance = new SessionInfo(url, userName, password, isCLIMode);
        }
    }

    getInstance() {
        return Singleton.instance;
    }
}

module.exports = Singleton