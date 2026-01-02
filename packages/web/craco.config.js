const webpack = require("webpack");
const {getWebpackTools} = require("react-native-monorepo-tools");

const monorepoWebpackTools = getWebpackTools();

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Allow importing from external workspaces.
            monorepoWebpackTools.enableWorkspacesResolution(webpackConfig);
            // Ensure nohoisted libraries are resolved from this workspace.
            monorepoWebpackTools.addNohoistAliases(webpackConfig);
            
            // Add babel-loader for react-native-screens to handle modern JS syntax
            const babelLoaderRule = webpackConfig.module.rules.find(
                rule => rule.oneOf
            );
            
            if (babelLoaderRule && babelLoaderRule.oneOf) {
                const jsLoaderRule = babelLoaderRule.oneOf.find(
                    rule => rule.loader && rule.loader.includes('babel-loader')
                );
                
                if (jsLoaderRule && jsLoaderRule.include) {
                    // Convert include to array if it's not already
                    jsLoaderRule.include = Array.isArray(jsLoaderRule.include) 
                        ? jsLoaderRule.include 
                        : [jsLoaderRule.include];
                    
                    // Add react-native-screens to the include list
                    jsLoaderRule.include.push(
                        /node_modules[/\\]react-native-screens/,
                        /node_modules[/\\]react-native-safe-area-context/
                    );
                }
            }
            
            // Configure SVG handling for web - Fix for @svgr/webpack
            // Find the rule that handles SVG files and exclude them
            const rules = webpackConfig.module.rules.find(rule => Array.isArray(rule.oneOf)).oneOf;
            
            // Find the file-loader rule (usually the last one) and exclude SVGs from it
            const fileLoaderRule = rules.find(rule => {
                return rule.loader && rule.loader.includes('file-loader');
            });
            
            if (fileLoaderRule) {
                // Exclude both SVG and HTML files from file-loader
                fileLoaderRule.exclude = /\.(svg|html)$/;
            }
            
            // Add SVGR loader for SVG files at the beginning
            rules.unshift({
                test: /\.svg$/,
                issuer: {
                    and: [/\.(ts|tsx|js|jsx|md|mdx)$/]
                },
                use: ['@svgr/webpack'],
            });
            
            return webpackConfig;
        },
        plugins: [
            // Inject the "__DEV__" global variable.
            new webpack.DefinePlugin({
                __DEV__: process.env.NODE_ENV !== "production",
            }),
        ],
    },
};