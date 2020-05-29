exports.Cache = function(_config = {}) {
    const config = _config;
    return function(key, value) {
        if (value && !key)
            throw new Error('Error in Cache: key is null but value is defined. cache(null,"value"). But it should be: cache(), cache(key),cache(key,value)');
        if (value)
            config[key] = value;

        if (key)
            return config[key];
        return config;
    }
}