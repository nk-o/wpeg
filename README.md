# 🤪 WPEG - WP Easy Generator

## 🤓 Installation

```$ npm install wpeg --save-dev```

## 🤓 Prepare config

WPEG works only with config in your theme/plugin directory. Create file `wpeg.config.js`. Example of file config:

```javascript
const pkg = require( 'json-file' ).read( './package.json' ).data;
const cfg = {};

// Build Paths.
cfg.src = './src';
cfg.dist = './dist';

// Template variables that will be automatically replaced.
// For example, strings like this:
//    esc_html__( 'String', '@@text_domain' )
//
// Will be converted to:
//    esc_html__( 'String', 'your-plugin-textdomain' )
//
cfg.template_variables = {
    text_domain: pkg.name,
    plugin_version: pkg.version,
    plugin_name: pkg.name,
    plugin_title: pkg.title,
    plugin_author: pkg.author,
};

// Copy files.
cfg.copy_files = '/**/*';
cfg.copy_files_ignore = '/**/*.{js,jsx,scss}';

// Compile SCSS files.
cfg.compile_scss_files = '/**/*.scss';
cfg.compile_scss_files_ignore = '/**/vendor/**/*';

// Compile JS files.
cfg.compile_js_files = '/**/*.js';
cfg.compile_js_files_ignore = '/**/vendor/**/*';

// Compile JSX files.
cfg.compile_jsx_files = [ '/*assets/js/index.jsx', '/*assets/admin/js/blocks.jsx' ];

// Correct line endings files.
cfg.correct_line_endings_files = '/**/*.{js,css}';

// Translate PHP files.
cfg.translate_php_files = '/**/*.php';
cfg.translate_php_dist = `/languages/${ cfg.template_variables.plugin_name }.pot`;
cfg.translate_php_options = {
    domain: cfg.template_variables.text_domain,
    package: cfg.template_variables.plugin_title,
    lastTranslator: cfg.template_variables.plugin_author,
    team: cfg.template_variables.plugin_author,
};

// ZIP files.
cfg.zip_files = '/**/*';

// Watch files.
cfg.watch_files = '/**/*';
cfg.watch_files_ignore = '/**/*.{php,jsx,js,scss}';

cfg.watch_js_files = '/**/*.js';
cfg.watch_js_files_ignore = '/*vendor/**/*';

cfg.watch_jsx_files = '/**/*.jsx';
cfg.watch_jsx_files_ignore = '/*vendor/**/*';

cfg.watch_scss_files = '/**/*.scss';

module.exports = cfg;
```

## 🤗 Usage

```$ npx wpeg <options>```

## 🤤 Options

- `-b`, `--build`     build theme/plugin
- `-w`, `--watch`     start watch changes in files and automatically run 'build' after changes
- `-z`, `--zip`       prepare ZIP file after build
- `-f`, `--ftp`       upload ZIP on FTP
- `-s`, `--ssh`       unpack uploaded ZIP

## 🤫 Other options

- `-h`, `--help`      show usage information
- `-v`, `--version`   show version info

## 😬 Example

```$ npx wpeg -b -w```
