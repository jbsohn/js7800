const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const fs = require('fs');

module.exports = {
  entry: {
    "js7800.min": "./src/js/index.js"
  },
  devtool: "source-map",
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'js7800',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(pal)$/i,
        use: [
          {
            loader: 'url-loader',
          },
        ],
      },
      {
        test: /\.(png|jp(e*)g|svg|gif)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 8192, // Convert images < 8kb to base64 strings
            name: 'images/[hash]-[name].[ext]'
          }
        }]
      }
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.min\.js$/
      }),
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'site/deploy'),
    publicPath: '/js/',
    compress: true,
    port: 8000
  },  
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
          let src = path.resolve(__dirname, 'dist/js7800.min.js');
          let dst = path.resolve(__dirname, 'site/deploy/js/js7800.min.js');
          fs.copyFile(src, dst,
            err => {
              if (!err) {
                console.log("Copied to site: " + src);
              } else {                
                throw "Failed copy to site: " + src
              }
            });
          
          let src_aym = path.resolve(__dirname, 'src/js/3rdparty/aym-emulator.js');
          let dst_aym = path.resolve(__dirname, 'site/deploy/js/aym-emulator.js');
          fs.copyFile(src_aym, dst_aym,
            err => {
              if (!err) {
                console.log("Copied aym-emulator to site: " + src_aym);
              } else {
                throw "Failed copy aym-emulator to site: " + src_aym
              }
            });
        });
      }
    }
  ]
};
