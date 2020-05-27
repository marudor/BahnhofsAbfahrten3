// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const LoadablePlugin = require('@loadable/webpack-plugin');
const PacktrackerPlugin = require('@packtracker/webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WorkboxPlugin = require('workbox-webpack-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';

const plugins = [
  new LoadablePlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'global.PROD': JSON.stringify(!isDev),
    'global.TEST': JSON.stringify(process.env.NODE_ENV === 'test'),
    'global.SERVER': JSON.stringify(false),
  }),
];
const entry = ['./packages/client/entry.ts'];

const rules = [
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
  {
    test: /\.(t|j)sx?$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          rootMode: 'upward',
          plugins: [require.resolve('react-refresh/babel')],
        },
      },
    ],
  },
  {
    test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
    loader: 'url-loader',
    options: {
      limit: 8192,
    },
  },
];

const optimization = {};

if (isDev) {
  if (process.env.BABEL_ENV !== 'testProduction') {
    rules[0].use.unshift('cache-loader');
    plugins.push(new webpack.HotModuleReplacementPlugin());
    plugins.push(new ReactRefreshWebpackPlugin());
    entry.push('webpack-hot-middleware/client');
  }
} else {
  if (process.env.SENTRY_AUTH_TOKEN) {
    plugins.push(
      new SentryCliPlugin({
        include: path.resolve('dist'),
      })
    );
  }
  plugins.push(
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
    })
  );
  plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    })
  );
  plugins.push(
    new PacktrackerPlugin({
      fail_build: true,
      upload: process.env.sendStats === 'true',
    })
  );
  optimization.minimizer = [
    new TerserPlugin({
      parallel: true,
      extractComments: {
        condition: 'all',
        banner: () => '',
      },
    }),
  ];
  optimization.splitChunks = {
    minSize: 30000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/](umi-request|react|react-dom|react-router|@material-ui|jss|downshift|date-fns)[\\/]/,
        name: 'vendor',
        chunks: 'all',
      },
    },
  };
  plugins.push(
    ...[
      new CompressionPlugin({
        filename: '[path].br[query]',
        test: /\.(js|css|svg)$/,
        algorithm: 'brotliCompress',
        compressionOptions: { level: 11 },
        threshold: 0,
        minRatio: 1,
      }),
      new CompressionPlugin({
        filename: '[path].gz[query]',
        test: /\.(js|css|svg)$/,
        algorithm: 'gzip',
        threshold: 0,
        minRatio: 1,
      }),
    ]
  );
}

module.exports = {
  optimization,
  plugins,
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'cheap-module-source-map' : 'source-map',
  entry,
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts', '.tsx', '.json', '.web.ts', '.js', '.jsx'],
    alias: {
      classnames$: 'clsx',
      'lodash-es$': 'lodash',
    },
  },
  output: {
    path: path.resolve(
      process.env.BABEL_ENV === 'testProduction'
        ? 'testDist/client'
        : 'dist/client'
    ),
    filename: isDev ? 'static/[name].[hash].js' : 'static/[contenthash].js',
    publicPath: '/',
  },
  module: {
    rules,
  },
  watchOptions: {
    ignored: /node_modules/,
  },
};
