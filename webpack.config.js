import fs from 'fs';

// find config
let customConfig = false;
const customConfigPath = `${ process.cwd() }/webpack.config.js`;
if ( fs.existsSync( customConfigPath ) ) {
    customConfig = require( customConfigPath );
}

export default function( isDev = false ) {
    return {
        mode: isDev ? 'development' : 'production',
        module: {
            rules: [
                {
                    test: /(\.jsx)$/,
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
        ...( customConfig || {} ),
    };
}
