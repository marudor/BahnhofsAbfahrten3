import { applyMiddleware, compose, createStore } from 'redux';
import { AppState } from 'AppState';
import reducer from './reducer';
import thunkMiddleware from 'redux-thunk';

export default (
  // eslint-disable-next-line no-underscore-dangle
  state: Partial<AppState> = global.__DATA__
) => {
  const middlewares = [thunkMiddleware];

  const composeEnhancers =
    // eslint-disable-next-line no-underscore-dangle
    global.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const store = createStore<AppState, any, {}, {}>(
    reducer,
    state,
    composeEnhancers(applyMiddleware(...middlewares))
  );

  if (!global.PROD && !global.SERVER) {
    Object.defineProperty(global, 'state', {
      get() {
        return store.getState();
      },
    });
  }

  // @ts-ignore
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    // @ts-ignore
    module.hot.accept('./reducer', () => {
      const nextRootReducer = require('./reducer').default;

      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
};
