import fs from 'fs';
import stringTemplate from 'string-template';

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

    // Compile SCSS files.
    compile_scss_files_src: '',
    compile_scss_files_src_opts: {},
    compile_scss_files_dist: '{dist}',

    // Compile JS files.
    compile_js_files_src: '',
    compile_js_files_src_opts: {},
    compile_js_files_dist: '{dist}',

    // Compile JSX files.
    compile_jsx_files_src: '',
    compile_jsx_files_src_opts: {},
    compile_jsx_files_dist: '{dist}',

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
            [not working yet] -f, --ftp       upload ZIP on FTP
            [not working yet] -s, --ssh       unpack uploaded ZIP

        🤫  Other options

            --clean         clean dist folder
            --help          show usage information
            --version       print version info

        😬  Example

            $ npx wpeg -b -w
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
        ftp: {
            type: 'boolean',
            alias: 'f',
        },
        ssh: {
            type: 'boolean',
            alias: 's',
        },

        clean: {
            type: 'boolean',
        },
    },
};

function templateConfig( variable, config ) {
    if ( ! config ) {
        config = variable;
    }

    if ( variable !== null && ( typeof variable === 'object' || Array.isArray( variable ) ) ) {
        Object.keys( variable ).forEach( ( k ) => {
            variable[ k ] = templateConfig( variable[ k ], config );
        } );
    }

    if ( typeof variable === 'string' ) {
        variable = stringTemplate( variable, config );
    }

    return variable;
}

export function getConfig() {
    let config = {};

    // find config
    const configPath = `${ process.cwd() }/wpeg.config.js`;
    if ( fs.existsSync( configPath ) ) {
        config = require( configPath );
    }

    config = templateConfig( {
        ...defaultConfig,
        ...config,
    } );

    return [ config ];
}

export function getWPEGConfig() {
    return WPEGConfig;
}
