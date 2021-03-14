const gulp = require( 'gulp' );
const gulpLoadPlugins = require( 'gulp-load-plugins' );

const plumberErrorHandler = require( '../plumber-error-handler' );

const $ = gulpLoadPlugins();

module.exports = {
    label: 'Translate PHP Files',
    isAllowed( cfg ) {
        return cfg.translate_php_files_src && cfg.translate_php_files_dist && cfg.translate_php_options;
    },
    fn: ( isDev ) => ( cfg ) => (
        gulp.src( cfg.translate_php_files_src, cfg.translate_php_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( $.sort() )
            .pipe( $.wpPot( cfg.translate_php_options ) )
            .pipe( gulp.dest( cfg.translate_php_files_dist ) )
    ),
};
