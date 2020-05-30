export function compute(text = '', expressionTypes, values, valuesParsable) {
    const paramValues = Object.values(values);

    const fn = typeof text == 'string' ? toFn(text, expressionTypes, valuesParsable) : text;
    const result = fn(...paramValues); //wirft einen Fehler, wenn invalide
    return result;
}

function toFn(text, expressionTypes, values) {

    for (let expressionType of expressionTypes) {
        try {
            if (expressionType.fn == null)
                throw `Expressiontype "${expressionType.key}" does not exist. If the name is correct, please add it with "Dombee.addExpressionType('${expressionTypeKey}', function(text,values){/*your code here*/})"`;

            return expressionType.fn(text, values);
        } catch (e) {
            if (typeof e == 'string')
                throw new Error(e);
            // This expressionType did not succeed. Maybe it is another one.
            // Try next one
        }
    }

    //no expressiontype succeeded, throw error;
    throw new Error(`Expression ${text} can not be parsed.`);
}