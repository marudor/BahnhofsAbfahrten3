/* eslint-disable no-underscore-dangle */
import { cleanup } from '@testing-library/react';
import Nock from 'nock';

afterEach(() => {
  cleanup();
  try {
    // @ts-ignore
    const store = window.__getTestStore__();

    store.restore();
  } catch (e) {
    // we ignore this
  }
});

// @ts-ignore just mocked
window.matchMedia = () => ({
  matches: false,
});

beforeAll(() => {
  Nock.disableNetConnect();

  global.nock = Nock('http://localhost');
  global.nock.intercept = ((oldFn) => {
    // eslint-disable-next-line func-names
    return function (this: any, ...args: any) {
      args[0] = args[0].replace(/ /g, '%20');

      return oldFn.apply(this, args);
    };
  })(global.nock.intercept);
});

afterAll(() => {
  Nock.restore();
  // @ts-ignore
  global.nock = undefined;
});
