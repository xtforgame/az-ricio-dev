import throttle from 'lodash/throttle';
import {
  makeUserSessionSelector,
  makeRememberUserSelector,
} from '~/containers/App/selectors';

const userSessionSelector = makeUserSessionSelector();
const rememberUserSelector = makeRememberUserSelector();

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState == null) {
      return undefined;
    }
    const global = JSON.parse(serializedState);
    return {
      global,
    };
  } catch (err) {
    console.error('loadState error :', err);
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    // console.log('state :', state);
    const serializedState = JSON.stringify(state);
    localStorage.setItem('state', serializedState);
  } catch (err) {
    console.error('saveState error :', err);
  }
};

export const removeState = () => {
  localStorage.removeItem('state');
};

export const clearState = () => {
  localStorage.clear();
};

const delaySave = throttle((store) => {
  const state = store.getState();
  const persistedData = state.get('global');

  if (rememberUserSelector(state) && userSessionSelector(state)) {
    const {
      sessions,
      persistence,
    } = persistedData;
    saveState({
      sessions,
      persistence,
    });
  } else {
    // removeState();
    localStorage.clear();
  }
}, 300);

export const middleware = store => next => (action) => {
  setTimeout(() => {
    delaySave(store);
  }, 0);
  return next(action);
};
