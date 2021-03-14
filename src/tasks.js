const gulp = require( 'gulp' );
const del = require( 'del' );
const gulpLoadPlugins = require( 'gulp-load-plugins' );
const named = require( 'vinyl-named-with-path' );
const Spinnies = require( 'spinnies' );
const chalk = require( 'chalk' );
const webpack = require( 'webpack' );
const $webpack = require( 'webpack-stream' );
const prettyHrtime = require( 'pretty-hrtime' );
const browserSync = require( 'browser-sync' ).create();
const Fiber = require( 'fibers' );
const autoprefixer = require( 'autoprefixer' );
const postCssScss = require( 'postcss-scss' );
const sass = require( 'gulp-sass' );

// Use Dart Sass https://sass-lang.com/dart-sass.
sass.compiler = require( 'sass' );

const webpackconfig = require( '../webpack.config' );

const { getConfig } = require( './config' );
const { time, error } = require( './notices' );

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
};

const currentLogs = {};
const spinnies = new Spinnies( { color: 'white', succeedColor: 'white' } );

function endTask( name ) {
    if ( currentLogs[ name ] ) {
        spinnies.succeed(
            name,
            {
                text: [
                    time(),
                    ' ',
                    chalk.blue( logTexts[ name ] || name || '' ),
                    ' after ',
                    chalk.red( prettyHrtime( process.hrtime( currentLogs[ name ] ) ) ),
                ].join( '' ),
            }
        );
        delete currentLogs[ name ];
    }
}
function startTask( name ) {
    // Already running
    if ( currentLogs[ name ] ) {
        endTask( name );
    }

    // Create new log
    spinnies.add(
        name,
        {
            text: [
                time(),
                ' ',
                chalk.blue( logTexts[ name ] || name || '' ),
            ].join( '' ),
        }
    );
    currentLogs[ name ] = process.hrtime();
}

/**
 * Generate CSS Comments TOC.
 * @param cont
 * @returns {*}
 */
function generateCSSComments( cont ) {
    const templateStart = '{{table_of_contents}}';
    const isset = cont.indexOf( templateStart );
    if ( -1 < isset ) {
        const rest = cont.substring( isset );
        const reg = /\/\*[ -]-[-]*?\n([\s\S]*?)\n[ -]*?-[ -]\*\//g;
        let titles = reg.exec( rest );
        let i = 1;
        let result = '';
        while ( null !== titles ) {
            if ( titles[ 1 ] ) {
                const isSub = ! /\n/.test( titles[ 1 ] );
                const str = titles[ 1 ].replace( /^\s+|\s+$/g, '' );
                if ( ! isSub ) {
                    result += `\n  ${ i }. `;
                    i += 1;
                } else {
                    result += '\n    - ';
                }
                result += str;
            }
            titles = reg.exec( rest );
        }

        cont = cont.replace( templateStart, result );
    }
    return cont;
}

/**
 * Replace patterns.
 * @param cont
 * @param patterns
 * @returns {*}
 */
function replacePatterns( cont, patterns ) {
    if ( patterns && patterns.length ) {
        patterns.forEach( ( pattern ) => {
            if ( pattern.match ) {
                const matchEscaped = pattern.match.replace( /([.*+?^${}()|[\]/\\])/g, '\\$1' );
                cont = cont.replace( new RegExp( `@@${ matchEscaped }`, 'g' ), pattern.replacement || '' );
            }
        } );
    }

    return cont;
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

    // run streams for each of items (theme and plugins)
    function runStream( name, func, isParallel = false ) {
        return ( done ) => {
            const dynamicTasks = configs.map( ( data ) => ( cb ) => func( data, cb ) );

            gulp.series(
                ( cb ) => {
                    if ( name ) {
                        startTask( name );
                    }
                    cb();
                },
                gulp[ isParallel ? 'parallel' : 'series' ]( ...dynamicTasks ),
                ( cb ) => {
                    if ( name ) {
                        endTask( name );
                    }
                    cb();
                }
            )( done );
        };
    }

    // clean dist folder.
    gulp.task( 'clean', runStream( 'clean', ( cfg, cb ) => {
        if ( ! cfg.clean_files ) {
            cb();
            return null;
        }

        return del( cfg.clean_files );
    } ) );

    // copy to dist.
    gulp.task( 'copy', runStream( 'copy', ( cfg, cb ) => {
        if ( ! cfg.copy_files_src || ! cfg.copy_files_dist ) {
            cb();
            return null;
        }

        return gulp.src( cfg.copy_files_src, cfg.copy_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( $.if( isDev, $.changed( cfg.copy_files_dist ) ) )
            .pipe( gulp.dest( cfg.copy_files_dist ) );
    } ) );

    // remote copy to dist.
    gulp.task( 'remote_copy', runStream( 'remote_copy', ( cfg, cb ) => {
        // Prevent remote copy if watch enabled.
        if ( isDev || ! cfg.remote_copy_files_src || ! cfg.remote_copy_files_dist ) {
            cb();
            return null;
        }

        return $.remoteSrc( cfg.remote_copy_files_src, cfg.remote_copy_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( $.if( isDev, $.changed( cfg.remote_copy_files_dist ) ) )
            .pipe( gulp.dest( cfg.remote_copy_files_dist ) );
    } ) );

    // prefix scss files.
    gulp.task( 'prefix_scss', runStream( 'prefix_scss', ( cfg, cb ) => {
        if ( ! cfg.prefix_scss_files_src || ! cfg.prefix_scss_files_dist ) {
            cb();
            return null;
        }

        return gulp.src( cfg.prefix_scss_files_src, cfg.prefix_scss_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )

            // Autoprefixer
            .pipe( $.postcss( [
                autoprefixer(),
            ], {
                syntax: postCssScss,
            } ) )

            // Dest
            .pipe( gulp.dest( cfg.prefix_scss_files_dist ) );
    } ) );

    // compile scss.
    gulp.task( 'compile_scss', runStream( 'compile_scss', ( cfg, cb ) => {
        if ( ! cfg.compile_scss_files_src || ! cfg.compile_scss_files_dist ) {
            cb();
            return null;
        }

        return gulp.src( cfg.compile_scss_files_src, cfg.compile_scss_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )

            // Sourcemaps Init
            .pipe( $.if( isDev, $.sourcemaps.init() ) )

            // SCSS
            .pipe( $.sassVariables( {
                $rtl: false,
            } ) )
            .pipe( sass( {
                fiber: Fiber,
                outputStyle: cfg.compile_scss_files_compress ? 'compressed' : 'expanded',
            } ).on( 'error', sass.logError ) )

            // Autoprefixer
            .pipe( $.postcss( [
                autoprefixer(),
            ] ) )

            // Add TOC Comments
            .pipe( $.changeFileContent( generateCSSComments ) )

            // Rename
            .pipe( $.if( cfg.compile_scss_files_compress, $.rename( {
                suffix: '.min',
            } ) ) )

            // Sourcemaps
            .pipe( $.if( isDev, $.sourcemaps.write() ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_scss_files_dist ) )

            // Browser Sync
            .pipe( browserSync.stream() );
    } ) );

    // compile scss rtl.
    gulp.task( 'compile_scss_rtl', runStream( 'compile_scss_rtl', ( cfg, cb ) => {
        if ( ! cfg.compile_scss_files_rtl || ! cfg.compile_scss_files_src || ! cfg.compile_scss_files_dist ) {
            cb();
            return null;
        }

        return gulp.src( cfg.compile_scss_files_src, cfg.compile_scss_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )

            // Sourcemaps Init
            .pipe( $.if( isDev, $.sourcemaps.init() ) )

            // SCSS
            .pipe( $.sassVariables( {
                $rtl: true,
            } ) )
            .pipe( sass( {
                fiber: Fiber,
                outputStyle: cfg.compile_scss_files_compress ? 'compressed' : 'expanded',
            } ).on( 'error', sass.logError ) )

            // Autoprefixer
            .pipe( $.postcss( [
                autoprefixer(),
            ] ) )

            // Add TOC Comments
            .pipe( $.changeFileContent( generateCSSComments ) )

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
            .pipe( browserSync.stream() );
    } ) );

    // compile js.
    gulp.task( 'compile_js', runStream( 'compile_js', ( cfg, cb ) => {
        if ( ! cfg.compile_js_files_src || ! cfg.compile_js_files_dist ) {
            cb();
            return null;
        }

        return gulp.src( cfg.compile_js_files_src, cfg.compile_js_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( named() )

            // Webpack.
            .pipe( $webpack( webpackconfig( isDev ), webpack ) )

            // Rename.
            .pipe( $.if( cfg.compile_js_files_compress, $.rename( {
                suffix: '.min',
            } ) ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_js_files_dist ) );
    } ) );

    // compile jsx.
    gulp.task( 'compile_jsx', runStream( 'compile_jsx', ( cfg, cb ) => {
        if ( ! cfg.compile_jsx_files_src || ! cfg.compile_jsx_files_dist ) {
            cb();
            return null;
        }

        return gulp.src( cfg.compile_jsx_files_src, cfg.compile_jsx_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( named() )

            // Webpack.
            .pipe( $webpack( webpackconfig( isDev ), webpack ) )

            // Rename.
            .pipe( $.if( cfg.compile_jsx_files_compress, $.rename( {
                suffix: '.min',
            } ) ) )

            // Dest
            .pipe( gulp.dest( cfg.compile_jsx_files_dist ) );
    } ) );

    // template files.
    gulp.task( 'template_files', runStream( 'template_files', ( cfg, cb ) => {
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
            cb();
            return null;
        }

        return gulp.src( cfg.template_files_src, cfg.template_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( $.if( isDev, $.changed( cfg.template_files_src ) ) )
            .pipe( $.changeFileContent( ( content ) => replacePatterns( content, patterns ) ) )
            .pipe( gulp.dest( cfg.template_files_dist ) );
    } ) );

    // correct line endings.
    gulp.task( 'correct_line_endings', runStream( 'correct_line_endings', ( cfg, cb ) => {
        if ( ! cfg.correct_line_endings_files_src || ! cfg.correct_line_endings_files_dist ) {
            cb();
            return null;
        }

        return gulp.src( cfg.correct_line_endings_files_src, cfg.correct_line_endings_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( $.if( isDev, $.changed( cfg.correct_line_endings_files_src ) ) )
            .pipe( $.lineEndingCorrector() )
            .pipe( gulp.dest( cfg.correct_line_endings_files_dist ) );
    } ) );

    // translate PHP.
    gulp.task( 'translate_php', runStream( 'translate_php', ( cfg, cb ) => {
        if ( ! cfg.translate_php_files_src || ! cfg.translate_php_files_dist || ! cfg.translate_php_options ) {
            cb();
            return null;
        }

        return gulp.src( cfg.translate_php_files_src, cfg.translate_php_files_src_opts )
            .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
            .pipe( $.sort() )
            .pipe( $.wpPot( cfg.translate_php_options ) )
            .pipe( gulp.dest( cfg.translate_php_files_dist ) );
    } ) );

    // build task.
    gulp.task( 'build', gulp.series(
        ( cb ) => {
            startTask( 'build' );
            cb();
        },
        'clean',
        gulp.parallel( 'copy', 'remote_copy' ),
        gulp.parallel( 'compile_scss', 'compile_scss_rtl' ),
        gulp.parallel( 'compile_js', 'compile_jsx' ),
        'prefix_scss',
        'template_files',
        'correct_line_endings',
        'translate_php',
        ( cb ) => {
            endTask( 'build' );
            cb();
        },
    ) );

    // ZIP task.
    gulp.task( 'zip', runStream( 'zip', ( cfg, done ) => {
        if ( ! cfg.zip_files || ! cfg.zip_files.length ) {
            done();
            return null;
        }

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
                .pipe( $.plumber( { errorHandler: plumberErrorHandler, inherit: isDev } ) )
                .pipe( $.zip( zipName ) )
                .pipe( gulp.dest( zipDist ) );
        } );

        return gulp.series( ...zipTasks )( done );
    } ) );

    let bsInited = false;

    // Browser Sync Init task.
    gulp.task( 'bs_init', runStream( '', ( cfg, cb ) => {
        if ( ! bsInited && cfg.browser_sync ) {
            bsInited = true;
            browserSync.init( cfg.browser_sync );
        }

        cb();
    } ) );

    // Browser Sync Reload task.
    gulp.task( 'bs_reload', runStream( '', ( cfg, cb ) => {
        if ( bsInited ) {
            browserSync.reload();
        }
        cb();
    } ) );

    // watch task.
    gulp.task( 'watch', gulp.series(
        'bs_init',
        () => {
            runStream( '', ( cfg, cb ) => {
                if ( cfg.watch_files ) {
                    gulp.watch( cfg.watch_files, gulp.series( 'copy', 'template_files', 'correct_line_endings', 'prefix_scss', 'bs_reload' ) );
                }

                if ( cfg.watch_js_files ) {
                    gulp.watch( cfg.watch_js_files, gulp.series( 'compile_js', 'bs_reload' ) );
                }

                if ( cfg.watch_jsx_files ) {
                    gulp.watch( cfg.watch_jsx_files, gulp.series( 'compile_jsx', 'bs_reload' ) );
                }

                if ( cfg.watch_scss_files ) {
                    gulp.watch( cfg.watch_scss_files, gulp.series( 'compile_scss', 'compile_scss_rtl' ) );
                }

                cb();
            } )();
        }
    ) );

    gulp.series( ...tasks )();
};
