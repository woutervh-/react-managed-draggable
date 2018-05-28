import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';

const plugins = [
    resolve(),
    commonjs()
];

if (process.env.ROLLUP_UGLIFY === 'true') {
    plugins.push(uglify());
}

export default {
    input: 'lib-es5/index.js',
    output: {
        name: 'ReactManagedDraggable',
        format: 'umd',
        globals: {
            react: 'React'
        },
        exports: 'named'
    },
    external: ['react'],
    plugins
};
