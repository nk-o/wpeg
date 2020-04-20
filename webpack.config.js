const fs = require( 'fs' );

// find config
let customConfig = false;
const customConfigPath = `${ process.cwd() }/webpack.config.js`;
if ( fs.existsSync( customConfigPath ) ) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    customConfig = require( customConfigPath );
}

module.exports = function( isDev = false ) {
    return {
        mode: isDev ? 'development' : 'production',
        stats: 'minimal',
        module: {
            rules: [
                {
                    test: /\.(jsx|js)$/i,
                    loader: 'babel-loader',
                }, {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: 'style-loader', // creates style nodes from JS strings
                        }, {
                            loader: 'css-loader', // translates CSS into CommonJS
                            options: {
                                url: false,
                            },
                        }, {
                            loader: 'sass-loader', // compiles Sass to CSS
                        },
                    ],
                },
            ],
        },
        ...( 'function' === typeof customConfig ? customConfig( isDev ) : ( customConfig || {} ) ),
    };
};
