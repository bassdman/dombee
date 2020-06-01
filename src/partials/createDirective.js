import { throwErrorIf } from '../helpers/throwError';

export function createDirective(config, { state, values }) {
    throwErrorIf(config == null, 'Dombee.directive(config) failed. The first parameter must be a config object or function, but is null.', 'directive-config=null');
    let directive = config;
    /*
        When the directive is wrapped in a function, unwrap this function
        Example: Dombee.directive(function testFn(){
            return {
                onChange: () => { //do sth },
                expressions: ['expression1','expression2']
            }
        })
        will result in
        {
            name: 'testFn'
            onChange: () => { //do sth },
            expressions: ['expression1','expression2']
        }
    */
    if (typeof config == 'function') {
        directive = config({ state, data: values });
        if (directive == null)
            throw new Error('Dombee.directive(config) failed. First parameter is a function (' + config + ') but it returns null. Did you forget to return the configuration?');
        directive.name = config.name;
    }
    throwErrorIf(directive.onChange == null, 'Dombee.directive(config) failed. Your directive config needs property "onChange" to be initialized successfully.', 'directive.onChangeIsNull');

    throwErrorIf(typeof directive.onChange !== 'function', 'Dombee.directive(config) failed. config.onChange must be a function.', 'directive.onChangeNoFunction');

    throwErrorIf(directive.expressions == null, 'Dombee.directive(config) failed. config.expressions must be a function. But it is null.', 'directive.expressionsIsNull')

    throwErrorIf(typeof directive.expressions != 'function', 'Dombee.directive(config) failed. config.expressions must be a function. But it is typeof ' + typeof config.expressions, 'directive.expressionsIsNotAFunction')

    /*
        Initialize the elements attribute
    */
    if (directive.bindTo == null)
        directive.bindTo = '*';

    throwErrorIf(typeof directive.bindTo != 'string', 'Dombee.directive(config) failed. config.bindTo must be a string. But it is typeof ' + typeof config.bindTo, 'directive.bindToNotString')


    return directive;
}