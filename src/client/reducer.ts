import { AppState } from 'AppState';
import { combineReducers } from 'redux';
import routingReducer from 'Routing/reducer';

const reducers: any = {
  ...routingReducer,
};
// eslint-disable-next-line import/no-mutable-exports
let reducer = combineReducers<AppState, any>(reducers);

// istanbul ignore next
if (global.TEST) {
  // eslint-disable-next-line no-inner-declarations
  function combineReducersWithRoot(rootReducer: any, reducers: any) {
    return (state: AppState, action: any) => {
      let newState = state;

      newState = rootReducer(state, action);

      Object.keys(reducers).forEach(domain => {
        // @ts-ignore
        const obj = newState ? newState[domain] : undefined;

        // @ts-ignore
        newState[domain] = reducers[domain](obj, action);
      });

      return newState;
    };
  }

  // @ts-ignore
  reducer = combineReducersWithRoot(require('./TestReducer').default, reducers);
}

export default reducer;
