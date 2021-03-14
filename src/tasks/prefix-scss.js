const gulp = require( 'gulp' );
const autoprefixer = require( 'autoprefixer' );
const postCssScss = require( 'postcss-scss' );
const gulpLoadPlugins = require( 'gulp-load-plugins' );

const plumberErrorHandler = require( '../plumber-error-handler' );

const $ = gulpLoadPlugins();

module.exports = {
    label: 'Prefix SCSS Files',
    isAllowed( cfg ) {
        return cfg.prefix_scss_files_src && cfg.prefix_scss_files_dist;
    },
    fn: ( isDev ) => ( cfg ) => (
        gulp.src( cfg.prefix_scss_files_src, cfg.prefix_scss_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )

            // Autoprefixer
            .pipe( $.postcss( [
                autoprefixer(),
            ], {
                syntax: postCssScss,
            } ) )

            // Dest
            .pipe( gulp.dest( cfg.prefix_scss_files_dist ) )
    ),
};
