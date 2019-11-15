import * as Sentry from '@sentry/node';
import { middlewares } from './logger';
import { Server as NetServer } from 'net';
import { Server } from 'https';
import axios from 'axios';
import config from './config';
import cookiesMiddleware from 'universal-cookie-koa';
import createAdmin from './admin';
import http from 'http';
import Koa, { Context, Middleware } from 'koa';
import KoaBodyparser from 'koa-bodyparser';
import koaStatic from 'koa-static';
import path from 'path';

global.SERVER = true;

function hotHelper(getMiddleware: () => Middleware) {
  if (process.env.NODE_ENV === 'production') {
    return getMiddleware();
  }

  return (ctx: Context, next: () => Promise<any>) => getMiddleware()(ctx, next);
}

export function createApp(wsServer?: Server) {
  const app = new Koa();

  if (config.sentryDSN && process.env.NODE_ENV !== 'test') {
    Sentry.init({ dsn: config.sentryDSN, environment: config.environment });
  }

  let apiRoutes = require('./API').default;
  let validationOverwrites = require('./API/validationOverwrites').default;
  let serverRender = require('./render').default;
  let seoController = require('./seo').default;
  let errorHandler = require('./errorHandler').default;

  let devPromise = Promise.resolve();

  if (
    process.env.NODE_ENV !== 'test' &&
    process.env.NODE_ENV !== 'production'
  ) {
    devPromise = require('./middleware/webpackDev')(app, wsServer).then(() => {
      app.use((ctx, next) => {
        errorHandler = require('./errorHandler').default;
        serverRender = require('./render').default;
        apiRoutes = require('./API').default;
        validationOverwrites = require('./API/validationOverwrites').default;
        seoController = require('./seo').default;
        Object.keys(ctx.state);
        ctx.loadableStats = JSON.parse(
          // eslint-disable-next-line no-sync
          ctx.state.fs.readFileSync(
            path.resolve('dist/client/loadable-stats.json')
          )
        );

        return next();
      });
    });
  }

  devPromise.then(() => {
    app.use(hotHelper(() => errorHandler));
    app.use(cookiesMiddleware());
    middlewares.forEach(m => app.use(m));
    app.use(KoaBodyparser());

    app.use(hotHelper(() => validationOverwrites.routes()));
    app.use(hotHelper(() => apiRoutes.routes()));

    const distFolder = process.env.TEST_RUN ? 'testDist' : 'dist';

    app.use(
      koaStatic(
        path.resolve(
          process.env.NODE_ENV === 'production'
            ? `${distFolder}/client`
            : 'public'
        ),
        {
          maxAge: 31536000000, // 1 year
        }
      )
    );

    app.use((ctx, next) => {
      if (ctx.path.endsWith('.js') || ctx.path.endsWith('.css')) {
        return;
      }
      if (ctx.url.startsWith('/api') || ctx.url.startsWith('/WRSheets')) {
        return;
      }

      return next();
    });

    app.use(hotHelper(() => seoController));

    if (process.env.NODE_ENV === 'production') {
      const loadableStats = require(path.resolve(
        `${distFolder}/client/loadable-stats.json`
      ));

      app.use((ctx, next) => {
        ctx.loadableStats = loadableStats;

        return next();
      });
    }

    app.use(hotHelper(() => serverRender));
  });

  return app;
}

export default () => {
  let server: NetServer;
  let wsServer: undefined | Server;

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test' &&
    !process.env.NO_SSL
  ) {
    const https = require('https');
    const fs = require('fs');
    // eslint-disable-next-line no-sync
    const key = fs.readFileSync('./secrets/ssl/privkey.pem');
    // eslint-disable-next-line no-sync
    const cert = fs.readFileSync('./secrets/ssl/server.pem');

    server = https.createServer({
      key,
      cert,
    });
    wsServer = https.createServer({
      key,
      cert,
    });
    axios.defaults.baseURL = `https://local.marudor.de:${config.port}`;
  } else {
    axios.defaults.baseURL = `http://localhost:${config.port}`;
    server = http.createServer();
  }
  const app = createApp(wsServer);

  server.addListener('request', app.callback());
  server.listen(config.port);
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('running in DEV mode!');
  } else {
    createAdmin();
  }

  return server;
};
