const path = require('path');

const CONSTANTS = {
    FIXED_ORDER: ['about', 'mods'],
    MOD_DIRS: {
        BUILTIN: path.join(__dirname, '..', 'mods'),
        USER: path.join(eagle.os.homedir(), '.eaglecooler', 'powereagle', 'mods')
    }
};

module.exports = CONSTANTS;