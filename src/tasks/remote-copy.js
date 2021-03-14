const gulp = require( 'gulp' );
const gulpLoadPlugins = require( 'gulp-load-plugins' );

const plumberErrorHandler = require( '../plumber-error-handler' );

const $ = gulpLoadPlugins();

module.exports = {
    label: 'Copy Remote Files',
    isAllowed( cfg, isDev ) {
        return ! isDev && cfg.remote_copy_files_src && cfg.remote_copy_files_dist;
    },
    fn: ( isDev ) => ( cfg ) => (
        $.remoteSrc( cfg.remote_copy_files_src, cfg.remote_copy_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( $.if( isDev, $.changed( cfg.remote_copy_files_dist ) ) )
            .pipe( gulp.dest( cfg.remote_copy_files_dist ) )
    ),
};
