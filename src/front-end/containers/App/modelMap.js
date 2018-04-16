import { getHeaders } from '~/utils/HeaderManager';
import {
  ModelMap,
  defaultExtensions,
  WaitableActionsCreator,
} from 'reduxtful';
import axios from 'axios';
import { Observable } from 'rxjs';
import { createSelector } from 'reselect';

const responseMiddleware = (response, info) => {
  if(response.status === 200 && response.data.error){
    // for some error carried by a 200 response
    return Promise.reject(response.data.error);
  }
  return Promise.resolve(response);
};

const epics = {
  axios,
  Observable,
  getHeaders,
  responseMiddleware,
}

const modelsDefine = {
  api: {
    url: '/api',
    names: { model: 'api', member: 'api', collection: 'apis' },
    singleton: true,
    config: {
      // actionNoRedundantBody: true,
      getId: data => 'api', // data.user_id,
    },
    extensionConfigs: {
      epics,
    },
  },
  sessions: {
    url: '/api/sessions',
    names: { model: 'session', member: 'session', collection: 'sessions' },
    config: {
      // actionNoRedundantBody: true,
      getId: data => 'me', // data.user_id,
    },
    extensionConfigs: {
      epics,
      selectors: {
        createSelector,
        baseSelector: state => state.get('global').sessions,
      },
    },
  },
  users: {
    url: '/api/users',
    names: { model: 'user', member: 'user', collection: 'users' },
    config: {
      // actionNoRedundantBody: true,
      getId: data => data.id,
    },
    extensionConfigs: {
      epics,
      selectors: {
        createSelector,
        baseSelector: state => state.get('global').users,
      },
    },
  },
};

const modelMap = new ModelMap('global', modelsDefine, defaultExtensions.concat([WaitableActionsCreator]));
export default modelMap;
