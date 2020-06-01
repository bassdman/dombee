let _errorMode = 'production';

export function throwError(message, identifier) {
    if (_errorMode == 'development')
        throw { id: identifier, message: message };

    throw new Error(message);
}

export function throwErrorIf(condition, message, identifier) {
    if (condition)
        throwError(message, identifier);
}

export function errorMode(errorMode) {
    _errorMode = errorMode;
}