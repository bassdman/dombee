//import resolve from '@rollup/plugin-node-resolve';
//import babel from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const plugins = [commonjs(), resolve()];

export default [{
    input: 'src/dombee.js',
    plugins,
    output: [{
        file: 'dest/dombee.js',
        format: 'iife',
        name: 'Dombee',
    }, {
        file: 'dest/dombee.min.js',
        format: 'iife',
        name: 'Dombee',
        plugins: [terser()],
    }, {
        file: 'dest/dombee-esm.js',
        format: 'es',
    }, {
        file: 'dest/dombee-cjs.js',
        format: 'cjs',
    }],
    /*plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' })
    ]*/
}, {
    input: 'src/dombee-core.js',
    plugins,
    output: [{
        file: 'dest/dombee-core.js',
        format: 'iife',
        name: 'Dombee',
    }, {
        file: 'dest/dombee-core.min.js',
        format: 'iife',
        name: 'Dombee',
    }, {
        file: 'dest/dombee-core-esm.js',
        format: 'es',
    }, {
        file: 'dest/dombee-core-cjs.js',
        format: 'cjs',
    }],
    /*plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' })
    ]*/
}, {
    input: ['src/helpers/Cache.js', 'src/helpers/throwError.js'],
    output: [{
        dir: 'spec/generated/',
        format: 'cjs',
    }],
}];