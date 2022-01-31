const fs = require('fs');
var path = require('path');
let crypto = require('crypto');
const homedir = require('os').homedir();

var commandsData;

var getProfile = (profileName) => {

    let secret = 'secret';
    
    let configFile = path.join(homedir, "wmcd_cli", "config.json");

    let cipher = crypto.createCipher('aes192', secret);  
    const decipher = crypto.createDecipher('aes192', secret);  
    var object;

    try {
        console.log('Reading Credentials from ' + configFile);
        if(!fs.existsSync(configFile)) {
            console.log("Config file does not exists. Create a config.json file at following path " + configFile);
            process.exit(1);
        }
        
        var input = fs.readFileSync(configFile, 'UTF-8');
        object = JSON.parse(input);

        for(let key in object) {
            cipher = crypto.createCipher('aes192', secret);
            var encrypted = cipher.update(object[key]['password'], 'utf8', 'hex');  
            encrypted += cipher.final('hex');
    
            if(!object[key]['password'].startsWith('@secure:')) {
                object[key].password = '@secure:' + encrypted;
            }
        }

    } catch(error) {
        console.error(error);
        porcess.exit(1);
    }

    var profile = object[profileName != undefined ? profileName : 'default'];
    if(!profile) {
        console.log("Specified profile does not exists");
        process.exit(1);
    }

    // writing back to a file
    let data = JSON.stringify(object, null, 4);
    fs.writeFileSync(configFile, data);

    var decryptedText = '';
    try {
        decipher.update(profile.password.substring(8, profile.password.length), 'hex', 'utf8');
        decryptedText += decipher.final('utf8');  
        profile.password = decryptedText;
    } catch(err) {
        console.log('The encrypted password is modified. Updated the password and remove the isEncrypted flag from the profile in config.json & try again.');
        process.exit(1);
    }

    return profile;
}

var getCommands = () => {
    if(commandsData) {
        return commandsData;
    }

    let configFile = path.join(__dirname, "/../../resources/configurations/metadata.json");
    var data = fs.readFileSync(configFile, 'UTF-8');
    commandsData = JSON.parse(data);
    return commandsData;
}

var getCommand = (objectName, id) => {
    var elements = commandsData[objectName];
    for(var i = 0; i < elements.length; i++) {
        if(id == elements[i].id) {
            return elements[i];
        }
    }
}

var getFile = (fileName) => {
    var data = fs.readFileSync(fileName, 'UTF-8');
    jsonData = JSON.parse(data);
    return jsonData;
}

module.exports = {
    getProfile,
    getCommand, 
    getCommands,
    getFile
}