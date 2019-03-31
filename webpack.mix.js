let mix = require('laravel-mix');
const webpack = require('webpack');


/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for your application, as well as bundling up your JS files.
 |
 */

mix.js('src/pdfjsannotate.js', 'dist/')
	.styles('src/pdfjsannotate.css', 'dist/pdfjsannotate.css')
	.webpackConfig({
		plugins: [
        	new webpack.IgnorePlugin(/^\.\/pdf.worker.js$/)
        ]
	});