const fs = require( 'fs' );

const stringTemplate = require( 'string-template' );

/**
 * Default Config.
 */
const defaultConfig = {
    // Build Paths.
    src: '',
    dist: '',

    // Clean files.
    clean_files: '{dist}',

    // Copy files.
    copy_files_src: '',
    copy_files_src_opts: { nodir: true },
    copy_files_dist: '{dist}',

    // Copy Remote files.
    remote_copy_files_src: '',
    remote_copy_files_src_opts: { nodir: true },
    remote_copy_files_dist: '{dist}',

    // Prefix SCSS files.
    prefix_scss_files_src: '',
    prefix_scss_files_src_opts: {},
    prefix_scss_files_dist: '{dist}',

    // Compile SCSS files.
    compile_scss_files_src: '',
    compile_scss_files_src_opts: {},
    compile_scss_files_dist: '{dist}',
    compile_scss_files_compress: true,
    compile_scss_files_rtl: false,

    // Compile JS files.
    compile_js_files_src: '',
    compile_js_files_src_opts: {},
    compile_js_files_dist: '{dist}',
    compile_js_files_compress: true,

    // Compile JSX files.
    compile_jsx_files_src: '',
    compile_jsx_files_src_opts: {},
    compile_jsx_files_dist: '{dist}',
    compile_jsx_files_compress: true,

    // Template variables that will be automatically replaced.
    template_files_src: '',
    template_files_src_opts: {},
    template_files_dist: '{dist}',
    template_files_variables: {},

    // Correct line endings files.
    correct_line_endings_files_src: '',
    correct_line_endings_files_src_opts: {},
    correct_line_endings_files_dist: '{dist}',

    // Translate PHP files.
    translate_php_files_src: '',
    translate_php_files_src_opts: {},
    translate_php_files_dist: '',
    translate_php_options: {
        domain: '',
        package: '',
        lastTranslator: '',
        team: '',
    },

    // ZIP files.
    zip_files: [],

    // Browser Sync.
    browser_sync: false,

    // Watch files.
    watch_files: '',

    watch_js_files: '',

    watch_jsx_files: '',

    watch_scss_files: '',
};

/**
 * WPEG Config
 */
const WPEGConfig = {
    help: `
        🤗  Usage

            $ npx wpeg <options>

        🤤  Options

            -b, --build     build theme/plugin
            -w, --watch     start watch changes in files and automatically run 'build' after changes
            -z, --zip       prepare ZIP file after build

        🤫  Other options

            --config        custom config, by default used automatic way. Custom example: \`--config="wpeg.config.js"\`
            --clean         clean dist folder
            --help          show usage information
            --version       print version info

        😬  Example

            $ npx wpeg --build --watch
    `,
    flags: {
        build: {
            type: 'boolean',
            alias: 'b',
        },
        watch: {
            type: 'boolean',
            alias: 'w',
        },
        zip: {
            type: 'boolean',
            alias: 'z',
        },

        clean: {
            type: 'boolean',
        },

        config: {
            type: 'string',
            default: 'auto',
        },
    },
};

function templateConfig( variable, config ) {
    if ( ! config ) {
        config = variable;
    }

    if ( null !== variable && ( 'object' === typeof variable || Array.isArray( variable ) ) ) {
        Object.keys( variable ).forEach( ( k ) => {
            variable[ k ] = templateConfig( variable[ k ], config );
        } );
    }

    if ( 'string' === typeof variable ) {
        variable = stringTemplate( variable, config );
    }

    return variable;
}

module.exports = {
    getConfig( fileName = 'auto' ) {
        const files = [];
        const configs = [];

        // Automatic parse configs.
        if ( 'auto' === fileName ) {
            fs.readdirSync( process.cwd() ).forEach( ( name ) => {
                if ( /wpeg.config.*.js/g.test( name ) ) {
                    files.push( name );
                }
            } );
        } else {
            files.push( fileName );
        }

        // Parse all configs.
        files.forEach( ( name ) => {
            let config = {};

            // find config
            const configPath = `${ process.cwd() }/${ name }`;
            if ( fs.existsSync( configPath ) ) {
                // eslint-disable-next-line global-require, import/no-dynamic-require
                config = require( configPath );
            }

            configs.push( templateConfig( {
                ...defaultConfig,
                ...config,
            } ) );
        } );

        return configs;
    },
    getWPEGConfig() {
        return WPEGConfig;
    },
};
