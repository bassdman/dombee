export function createDirective(config, { state, values }) {
    if (config == null)
        throw new Error('Dombee.directive(config) failed. The first parameter must be a config object or function, but is null.');
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
            throw new Error('Dombee.directive(config) failed. Your first parameter is a function (' + config + ') but it returns null. Did you forget to return the configuration?');
        directive.name = config.name;
    }
    if (directive.onChange == null)
        throw new Error('Dombee.directive(config) failed. Your directive config needs property "onChange" to be initialized successfully.');
    if (typeof directive.onChange !== 'function')
        throw new Error('Dombee.directive(config) failed. config.onChange must be a function.');
    if (!(typeof directive.expressions == 'function'))
        throw new Error('Dombee.directive(config) failed. config.expressions must be a function. But it is typeof ' + typeof config.expressions);
    /*
        Initialize the elements attribute
    */


    return directive;
}