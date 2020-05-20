//import resolve from '@rollup/plugin-node-resolve';
//import babel from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";

export default [{
    input: 'src/dombee.js',
    output: [{
        file: 'dest/dombee.js',
        format: 'iife',
        name: 'Dombee',
    }, {
        file: 'dest/dombee.min.js',
        format: 'iife',
        name: 'Dombee',
        plugins: [terser()]
    }, {
        file: 'dest/dombee-esm.js',
        format: 'es',
    }],
    /*plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' })
    ]*/
}, {
    input: 'src/dombee-core.js',
    output: [{
        file: 'dest/dombee-core.js',
        format: 'iife',
        name: 'Dombee'
    }, {
        file: 'dest/dombee-core.min.js',
        format: 'iife',
        name: 'Dombee'
    }, {
        file: 'dest/dombee-core-esm.js',
        format: 'es',
    }],
    /*plugins: [
      resolve(),
      babel({ babelHelpers: 'bundled' })
    ]*/
}];