'use strict';

var webpack = require('webpack');

module.exports = () => {
    return {
        entry: './index',
        mode: 'production',
        devtool: 'source-map',
        output: {
            filename: './async-request-builder.js',
            libraryTarget: 'umd'
        },
        plugins: [new webpack.IgnorePlugin(/mysql|mongo|http|file|aggregator/)],
        module: {
            rules: [{
                test: /\.js$/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['es2015', {
                                modules: false
                            }]
                        ]
                    }
                }]
            }]
        }
    };
};