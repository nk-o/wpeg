const gulp = require( 'gulp' );
const named = require( 'vinyl-named-with-path' );
const webpack = require( 'webpack' );
const $webpack = require( 'webpack-stream' );
const gulpLoadPlugins = require( 'gulp-load-plugins' );

const plumberErrorHandler = require( '../plumber-error-handler' );
const webpackconfig = require( '../../webpack.config' );

const $ = gulpLoadPlugins();

module.exports = {
    label: 'JS Compiler',
    isAllowed( cfg ) {
        return cfg.compile_js_files_src && cfg.compile_js_files_dist;
    },
    fn: ( isDev ) => ( cfg ) => (
        gulp.src( cfg.compile_js_files_src, cfg.compile_js_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( named() )

            // Webpack.
            .pipe( $webpack( webpackconfig( isDev ), webpack ) )

            // Rename.
            .pipe( $.if( cfg.compile_js_files_compress, $.rename( {
                suffix: '.min',
            } ) ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_js_files_dist ) )
    ),
};
