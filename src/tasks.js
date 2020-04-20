const gulp = require( 'gulp' );
const del = require( 'del' );
const gulpLoadPlugins = require( 'gulp-load-plugins' );
const named = require( 'vinyl-named-with-path' );
const webpack = require( 'webpack-stream' );
const prettyHrtime = require( 'pretty-hrtime' );
const browserSync = require( 'browser-sync' ).create();

const webpackconfig = require( '../webpack.config' );

const { getConfig } = require( './config' );
const { log, error } = require( './notices' );

const $ = gulpLoadPlugins();

const logTexts = {
    build: 'Build',
    clean: 'Clean Dist',
    copy: 'Copy Files',
    remote_copy: 'Copy Remote Files',
    compile_scss: 'SCSS Compiler',
    compile_scss_rtl: 'SCSS RTL Compiler',
    compile_js: 'JS Compiler',
    compile_jsx: 'JSX Compiler',
    template_files: 'Template Files',
    correct_line_endings: 'Correct line endings for non UNIX systems',
    translate_php: 'Translate PHP Files',
    zip: 'ZIP Files',
    watch_copy: 'Watch Files',
    watch_compile_js: 'Watch JS Files',
    watch_compile_jsx: 'Watch JSX Files',
    watch_compile_scss: 'Watch SCSS Files',
};

const logHrTime = {};

function startTask( name, cfg ) {
    logHrTime[ name ] = process.hrtime();
    log( 'Starting', `${ logTexts[ name ] || name }`, '', cfg ? cfg.name || '' : '' );
}
function endTask( name, cfg ) {
    const time = logHrTime[ name ] ? prettyHrtime( process.hrtime( logHrTime[ name ] ) ) : '';
    log( 'Finished', `${ logTexts[ name ] || name }`, time, cfg ? cfg.name || '' : '' );
}

/**
 * Error Handler for gulp-plumber
 *
 * @param {Object} err error object.
 */
function plumberErrorHandler( err ) {
    // eslint-disable-next-line
    error( err );
    this.emit( 'end' );
}

module.exports = function( tasks = [], config ) {
    const configs = getConfig( config );

    // Is development.
    const isDev = -1 !== tasks.indexOf( 'watch' );

    // run streams for each of theme items (theme and plugins)
    function runStream( func ) {
        return ( done ) => {
            const dynamicTasks = configs.map( ( data ) => ( cb ) => func( data, cb ) );

            gulp.series( ...dynamicTasks )( done );
        };
    }

    // clean dist folder.
    gulp.task( 'clean', runStream( ( cfg, cb ) => {
        if ( ! cfg.clean_files ) {
            cb();
            return null;
        }

        startTask( 'clean', cfg );

        return del( cfg.clean_files ).then( () => {
            endTask( 'clean', cfg );
        } );
    } ) );

    // copy to dist.
    gulp.task( 'copy', runStream( ( cfg, cb ) => {
        if ( ! cfg.copy_files_src || ! cfg.copy_files_dist ) {
            cb();
            return null;
        }

        startTask( 'copy', cfg );

        return gulp.src( cfg.copy_files_src, cfg.copy_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )
            .pipe( $.if( isDev, $.changed( cfg.copy_files_dist ) ) )
            .pipe( gulp.dest( cfg.copy_files_dist ) )
            .on( 'end', () => {
                endTask( 'copy', cfg );
            } );
    } ) );

    // remote copy to dist.
    gulp.task( 'remote_copy', runStream( ( cfg, cb ) => {
        if ( ! cfg.remote_copy_files_src || ! cfg.remote_copy_files_dist ) {
            cb();
            return null;
        }

        startTask( 'remote_copy', cfg );

        return $.remoteSrc( cfg.remote_copy_files_src, cfg.remote_copy_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )
            .pipe( $.if( isDev, $.changed( cfg.remote_copy_files_dist ) ) )
            .pipe( gulp.dest( cfg.remote_copy_files_dist ) )
            .on( 'end', () => {
                endTask( 'remote_copy', cfg );
            } );
    } ) );

    // compile scss.
    gulp.task( 'compile_scss', runStream( ( cfg, cb ) => {
        if ( ! cfg.compile_scss_files_src || ! cfg.compile_scss_files_dist ) {
            cb();
            return null;
        }

        startTask( 'compile_scss', cfg );

        return gulp.src( cfg.compile_scss_files_src, cfg.compile_scss_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )

            // Sourcemaps Init
            .pipe( $.if( isDev, $.sourcemaps.init() ) )

            // SCSS
            .pipe( $.sass( {
                outputStyle: cfg.compile_scss_files_compress ? 'compressed' : 'expanded',
            } ).on( 'error', $.sass.logError ) )

            // Autoprefixer
            .pipe( $.autoprefixer() )

            // Rename
            .pipe( $.if( cfg.compile_scss_files_compress, $.rename( {
                suffix: '.min',
            } ) ) )

            // Sourcemaps
            .pipe( $.if( isDev, $.sourcemaps.write() ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_scss_files_dist ) )

            // Browser Sync
            .pipe( browserSync.stream() )
            .on( 'end', () => {
                endTask( 'compile_scss', cfg );
            } );
    } ) );

    // compile scss rtl.
    gulp.task( 'compile_scss_rtl', runStream( ( cfg, cb ) => {
        if ( ! cfg.compile_scss_files_rtl || ! cfg.compile_scss_files_src || ! cfg.compile_scss_files_dist ) {
            cb();
            return null;
        }

        startTask( 'compile_scss_rtl', cfg );

        return gulp.src( cfg.compile_scss_files_src, cfg.compile_scss_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )

            // Sourcemaps Init
            .pipe( $.if( isDev, $.sourcemaps.init() ) )

            // SCSS
            .pipe( $.sass( {
                outputStyle: cfg.compile_scss_files_compress ? 'compressed' : 'expanded',
            } ).on( 'error', $.sass.logError ) )

            // Autoprefixer
            .pipe( $.autoprefixer() )

            // RTL
            .pipe( $.rtlcss() )

            // Rename
            .pipe( $.if( ! cfg.compile_scss_files_compress, $.rename( {
                suffix: '-rtl',
            } ) ) )
            .pipe( $.if( cfg.compile_scss_files_compress, $.rename( {
                suffix: '-rtl.min',
            } ) ) )

            // Sourcemaps
            .pipe( $.if( isDev, $.sourcemaps.write() ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_scss_files_dist ) )

            // Browser Sync
            .pipe( browserSync.stream() )
            .on( 'end', () => {
                endTask( 'compile_scss_rtl', cfg );
            } );
    } ) );

    // compile js.
    gulp.task( 'compile_js', runStream( ( cfg, cb ) => {
        if ( ! cfg.compile_js_files_src || ! cfg.compile_js_files_dist ) {
            cb();
            return null;
        }

        startTask( 'compile_js', cfg );

        return gulp.src( cfg.compile_js_files_src, cfg.compile_js_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )
            .pipe( named() )

            // Webpack.
            .pipe( webpack( webpackconfig( isDev ) ) )

            // Rename.
            .pipe( $.if( cfg.compile_js_files_compress, $.rename( {
                suffix: '.min',
            } ) ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_js_files_dist ) )

            .on( 'end', () => {
                endTask( 'compile_js', cfg );
            } );
    } ) );

    // compile jsx.
    gulp.task( 'compile_jsx', runStream( ( cfg, cb ) => {
        if ( ! cfg.compile_jsx_files_src || ! cfg.compile_jsx_files_dist ) {
            cb();
            return null;
        }

        startTask( 'compile_jsx', cfg );

        return gulp.src( cfg.compile_jsx_files_src, cfg.compile_jsx_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )
            .pipe( named() )

            // Webpack.
            .pipe( webpack( webpackconfig( isDev ) ) )

            // Rename.
            .pipe( $.if( cfg.compile_jsx_files_compress, $.rename( {
                suffix: '.min',
            } ) ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_jsx_files_dist ) )

            .on( 'end', () => {
                endTask( 'compile_jsx', cfg );
            } );
    } ) );

    // template files.
    gulp.task( 'template_files', runStream( ( cfg, cb ) => {
        if ( ! cfg.template_files_src || ! cfg.template_files_dist ) {
            cb();
            return null;
        }

        const patterns = Object.keys( cfg.template_files_variables )
            .filter( ( k ) => 'undefined' !== typeof cfg.template_files_variables[ k ] )
            .map( ( k ) => ( {
                match: k,
                replacement: cfg.template_files_variables[ k ],
            } ) );

        if ( ! patterns.length ) {
            return null;
        }

        startTask( 'template_files', cfg );

        return gulp.src( cfg.template_files_src, cfg.template_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )
            .pipe( $.if( isDev, $.changed( cfg.template_files_src ) ) )
            .pipe( $.replaceTask( {
                patterns,
            } ) )
            .pipe( gulp.dest( cfg.template_files_dist ) )
            .on( 'end', () => {
                endTask( 'template_files', cfg );
            } );
    } ) );

    // correct line endings.
    gulp.task( 'correct_line_endings', runStream( ( cfg, cb ) => {
        if ( ! cfg.correct_line_endings_files_src || ! cfg.correct_line_endings_files_dist ) {
            cb();
            return null;
        }

        startTask( 'correct_line_endings', cfg );

        return gulp.src( cfg.correct_line_endings_files_src, cfg.correct_line_endings_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )
            .pipe( $.if( isDev, $.changed( cfg.correct_line_endings_files_src ) ) )
            .pipe( $.lineEndingCorrector() )
            .pipe( gulp.dest( cfg.correct_line_endings_files_dist ) )
            .on( 'end', () => {
                endTask( 'correct_line_endings', cfg );
            } );
    } ) );

    // translate PHP.
    gulp.task( 'translate_php', runStream( ( cfg, cb ) => {
        if ( ! cfg.translate_php_files_src || ! cfg.translate_php_files_dist || ! cfg.translate_php_options ) {
            cb();
            return null;
        }

        startTask( 'translate_php', cfg );

        return gulp.src( cfg.translate_php_files_src, cfg.translate_php_files_src_opts )
            .pipe( $.plumber( { plumberErrorHandler } ) )
            .pipe( $.sort() )
            .pipe( $.wpPot( cfg.translate_php_options ) )
            .pipe( gulp.dest( cfg.translate_php_files_dist ) )
            .on( 'end', () => {
                endTask( 'translate_php', cfg );
            } );
    } ) );

    // build task.
    gulp.task( 'build', gulp.series(
        ( cb ) => {
            startTask( 'build' );
            cb();
        },
        'clean',
        'copy',
        'remote_copy',
        'compile_scss',
        'compile_scss_rtl',
        'compile_js',
        'compile_jsx',
        'template_files',
        'correct_line_endings',
        'translate_php',
        ( cb ) => {
            endTask( 'build' );
            cb();
        },
    ) );

    // ZIP task.
    gulp.task( 'zip', runStream( ( cfg, done ) => {
        if ( ! cfg.zip_files || ! cfg.zip_files.length ) {
            done();
            return null;
        }

        startTask( 'zip', cfg );

        const zipTasks = cfg.zip_files.map( ( zipData ) => ( cb ) => {
            let gulpSrc = gulp.src;
            let gulpSrcUrl = zipData.src;

            if ( zipData.src_remote ) {
                gulpSrc = $.remoteSrc;
                gulpSrcUrl = zipData.src_remote;
            }

            if ( ! gulpSrcUrl || ! zipData.dist ) {
                cb();
                return null;
            }

            const pathAndName = zipData.dist.match( /^(.*)[\\/](.*)/ );

            if ( ! pathAndName || 3 !== pathAndName.length ) {
                cb();
                return null;
            }

            const zipDist = pathAndName[ 1 ];
            const zipName = pathAndName[ 2 ];

            return gulpSrc( gulpSrcUrl, {
                nodir: true,
                ...( zipData.src_opts || {} ),
            } )
                .pipe( $.plumber( { plumberErrorHandler } ) )
                .pipe( $.zip( zipName ) )
                .pipe( gulp.dest( zipDist ) );
        } );

        zipTasks.push( ( cb ) => {
            endTask( 'zip', cfg );
            cb();
        } );

        return gulp.series( ...zipTasks )( done );
    } ) );

    let bsInited = false;

    // Browser Sync Init task.
    gulp.task( 'bs_init', runStream( ( cfg, cb ) => {
        if ( ! bsInited && cfg.browser_sync ) {
            bsInited = true;
            browserSync.init( cfg.browser_sync );
        }

        cb();
    } ) );

    // Browser Sync Reload task.
    gulp.task( 'bs_reload', runStream( ( cfg, cb ) => {
        if ( bsInited ) {
            browserSync.reload();
        }
        cb();
    } ) );

    // watch task.
    gulp.task( 'watch', gulp.series(
        'bs_init',
        runStream( ( cfg ) => {
            if ( cfg.watch_files ) {
                startTask( 'watch_copy', cfg );
                gulp.watch( cfg.watch_files, gulp.series( 'copy', 'template_files', 'correct_line_endings', 'bs_reload' ) );
            }

            if ( cfg.watch_js_files ) {
                startTask( 'watch_compile_js', cfg );
                gulp.watch( cfg.watch_js_files, gulp.series( 'compile_js', 'bs_reload' ) );
            }

            if ( cfg.watch_jsx_files ) {
                startTask( 'watch_compile_jsx', cfg );
                gulp.watch( cfg.watch_jsx_files, gulp.series( 'compile_jsx', 'bs_reload' ) );
            }

            if ( cfg.watch_scss_files ) {
                startTask( 'watch_compile_scss', cfg );
                gulp.watch( cfg.watch_scss_files, gulp.series( 'compile_scss', 'compile_scss_rtl' ) );
            }
        } ),
    ) );

    gulp.series( ...tasks )();
};
