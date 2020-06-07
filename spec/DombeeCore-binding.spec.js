const { getDombeeCoreInstance } = require('./helpers/helpers');

describe("Dombee-binding", function() {

    beforeEach(function() {
        //Dombee.reset();
    });

    describe("after initialisation", function() {
        it("should not call onChange after init if data is empty and directive is not referenced in HTML", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p>name</p></div>');
            const onChange = jasmine.createSpy('onChange');

            Dombee.directive({ bindTo: 'data-test', onChange, expressions: $elem => $elem.dataset.test });
            Dombee({ bindTo: '#renderTo' });

            expect(onChange).not.toHaveBeenCalledTimes(1);
        });

        it("should not call onChange after init if data is empty and directive is referenced in HTML", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-test="hallo">name</p></div>');
            const onChange = jasmine.createSpy('onChange');

            Dombee.directive({ bindTo: 'data-test', onChange, expressions: $elem => $elem.dataset.test });
            Dombee({ bindTo: '#renderTo' });

            expect(onChange).not.toHaveBeenCalledTimes(1);
        });

        it("should call onChange if data={name:'xyz'} and directive is referenced in HTML", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-test="name">name</p></div>');
            const onChange = jasmine.createSpy('onChange');

            Dombee.directive({ bindTo: 'data-test', onChange, expressions: $elem => $elem.dataset.test });
            Dombee({ bindTo: '#renderTo', data: { name: 'xyz' } });

            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it("should not call onChange if data={name:'xyz'} and directive is not referenced in HTML but data-test exists", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-test="xyz">name</p></div>');
            const onChange = jasmine.createSpy('onChange');

            Dombee.directive({ bindTo: 'data-test', onChange, expressions: $elem => $elem.dataset.test });
            Dombee({ bindTo: '#renderTo', data: { name: 'xyz' } });

            expect(onChange).not.toHaveBeenCalledTimes(1);
        });

        it("should call onChangeA but not onChangeB if data={valuea:true}", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-testa="valuea">name</p></div>');
            const onChangeA = jasmine.createSpy('onChangeA');
            const onChangeB = jasmine.createSpy('onChangeB');

            Dombee.directive({ bindTo: 'data-testa', onChange: onChangeA, expressions: $elem => $elem.dataset.testa });
            Dombee.directive({ bindTo: 'data-testb', onChange: onChangeB, expressions: $elem => $elem.dataset.testb });
            Dombee({ bindTo: '#renderTo', data: { valuea: true } });

            expect(onChangeA).toHaveBeenCalledTimes(1);
            expect(onChangeB).not.toHaveBeenCalledTimes(1);
        });

        it("should call onChangeA and onChangeB if data={valuea:true,valueb:true}", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-testa="valuea" data-testb="valueb">name</p></div>');
            const onChangeA = jasmine.createSpy('onChangeA');
            const onChangeB = jasmine.createSpy('onChangeB');

            Dombee.directive({ bindTo: 'data-testa', onChange: onChangeA, expressions: $elem => $elem.dataset.testa });
            Dombee.directive({ bindTo: 'data-testb', onChange: onChangeB, expressions: $elem => $elem.dataset.testb });
            Dombee({ bindTo: '#renderTo', data: { valuea: true, valueb: true } });

            expect(onChangeA).toHaveBeenCalledTimes(1);
            expect(onChangeB).toHaveBeenCalledTimes(1);
        });

        it("should call onChangeA and onChangeB if data={valuea:true,valueb:(data)=>data.valuea+data.valuea)}", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-testa="valuea" data-testb="valueb">name</p></div>');
            const onChangeA = jasmine.createSpy('onChangeA');
            const onChangeB = jasmine.createSpy('onChangeB');

            Dombee.directive({ bindTo: 'data-testa', onChange: onChangeA, expressions: $elem => $elem.dataset.testa });
            Dombee.directive({ bindTo: 'data-testb', onChange: onChangeB, expressions: $elem => $elem.dataset.testb });
            Dombee({ bindTo: '#renderTo', data: { valuea: true, valueb: (data) => data.valuea + data.valuea } });

            expect(onChangeA).toHaveBeenCalledTimes(1);
            expect(onChangeB).toHaveBeenCalledTimes(1);
        });

        it("should call onChangeNested 1x if data={level1:{level2:true}}", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-test="level1.level2">name</p></div>');
            const onChangeNested = jasmine.createSpy('onChangeA');

            Dombee.directive({ bindTo: 'data-test', onChange: onChangeNested, expressions: $elem => $elem.dataset.test });
            const dm = Dombee({ bindTo: '#renderTo', data: { level1: { level2: true } } });

            expect(onChangeNested).toHaveBeenCalledTimes(1);
        });

        it("should call onChangeNested 2x if data={level1:{level2:true}} and level1.level2 changed after init", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-test="level1.level2">name</p></div>');
            const onChangeNested = jasmine.createSpy('onChangeA');

            Dombee.directive({ bindTo: 'data-test', onChange: onChangeNested, expressions: $elem => $elem.dataset.test });
            const dm = Dombee({ bindTo: '#renderTo', data: { level1: { level2: true } } });
            dm.state.level1.level2 = false;

            expect(onChangeNested).toHaveBeenCalledTimes(2);
        });

        it("should not call onChangeNested if data={level1:{level2WrongKey:true}}", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-test="level1.level2">name</p></div>');
            const onChangeNested = jasmine.createSpy('onChangeA');

            Dombee.directive({ bindTo: 'data-test', onChange: onChangeNested, expressions: $elem => $elem.dataset.test });
            Dombee({ bindTo: '#renderTo', data: { level1: { level2WrongKey: true } } });

            expect(onChangeNested).toHaveBeenCalledTimes(1);
        });
    });
    describe("after data change", function() {
        it("should call onChange 2x if data={name:'xyz'}", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-test="name">name</p></div>');
            const onChange = jasmine.createSpy('onChange');

            Dombee.directive({ bindTo: 'data-test', onChange, expressions: $elem => $elem.dataset.test });
            const dm = Dombee({ bindTo: '#renderTo', data: { name: 'xyz' } });
            dm.state.name = 'abc'

            expect(onChange).toHaveBeenCalledTimes(2);
        });

        it("should call onChangeA 2x and onChangeB 1x if data={valuea:true,valueb:true} and valuea changed", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-testa="valuea" data-testb="valueb">name</p></div>');
            const onChangeA = jasmine.createSpy('onChangeA');
            const onChangeB = jasmine.createSpy('onChangeB');

            Dombee.directive({ bindTo: 'data-testa', onChange: onChangeA, expressions: $elem => $elem.dataset.testa });
            Dombee.directive({ bindTo: 'data-testb', onChange: onChangeB, expressions: $elem => $elem.dataset.testb });
            const dm = Dombee({ bindTo: '#renderTo', data: { valuea: true, valueb: true } });
            dm.state.valuea = 'newvalue';

            expect(onChangeA).toHaveBeenCalledTimes(2);
            expect(onChangeB).toHaveBeenCalledTimes(1);
        });

        it("should call onChangeA 2x and onChangeB 2x with data={valuea:true,valueb:(data)=>data.valuea+data.valuea)} if valuea changed", function() {
            const Dombee = getDombeeCoreInstance('<div id="renderTo"><p data-testa="valuea" data-testb="valueb">name</p></div>');
            const onChangeA = jasmine.createSpy('onChangeA');
            const onChangeB = jasmine.createSpy('onChangeB');

            Dombee.directive({ bindTo: 'data-testa', onChange: onChangeA, expressions: $elem => $elem.dataset.testa });
            Dombee.directive({ bindTo: 'data-testb', onChange: onChangeB, expressions: $elem => $elem.dataset.testb });
            const dm = Dombee({ bindTo: '#renderTo', data: { valuea: true, valueb: (data) => data.valuea + data.valuea } });
            dm.state.valuea = 'newvalue';

            expect(onChangeA).toHaveBeenCalledTimes(2);
            expect(onChangeB).toHaveBeenCalledTimes(2);
        });
    });
});