const gulp = require( 'gulp' );
const gulpLoadPlugins = require( 'gulp-load-plugins' );

const plumberErrorHandler = require( '../plumber-error-handler' );

const $ = gulpLoadPlugins();

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

module.exports = {
    label: 'Template Files',
    isAllowed( cfg ) {
        return cfg.template_files_src && cfg.template_files_dist;
    },
    fn: ( isDev ) => ( cfg, cb ) => {
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
    },
};
