import { Observable } from 'rxjs';
import { promiseWait } from 'common/utils';

import {
  ActionTypesCreator,
  ActionsCreator,
  UrlInfo,
} from 'reduxtful';

const createRespondActionCreatorForCollection = (actions, startAction) => (response) => actions.respond(
  response.data,
  startAction.entry,
  {
    timestamp: new Date().getTime(),
    transferables: startAction.options.transferables,
  },
);

const createRespondActionCreatorForPostCollection = (actions, startAction, getId) => (response) => actions.respond(
  getId(response.data),
  response.data,
  startAction.entry,
  {
    timestamp: new Date().getTime(),
    transferables: startAction.options.transferables,
  },
);

const createRespondActionCreatorForMember = (actions, startAction, getId) => (response) => actions.respond(
  startAction.entry.id,
  response.data,
  startAction.entry,
  {
    timestamp: new Date().getTime(),
    transferables: startAction.options.transferables,
  },
);

const createRespondErrorActionCreatorForCollection = (actions, startAction) => (error) => {
  // console.log('error :', error);
  return actions.respondError(
    { error },
    {},
    {
      timestamp: new Date().getTime(),
      transferables: startAction.options.transferables,
    }
  );
}

const createRespondErrorActionCreatorForMember = (actions, startAction) => (error) => {
  // console.log('error :', error);
  return actions.respondError(
    startAction.entry.id,
    { error },
    {},
    {
      timestamp: new Date().getTime(),
      transferables: startAction.options.transferables,
    }
  );
}

export default class ReduxtfulWsEpicCreator {
  static $name = 'wsEpics';

  create({ ns, names, url, getShared, methodConfigs }, { getId = (action => action.data.id) }, extensionConfig){
    let shared = {};
    let exposed = {};

    const {
      wsProtocol,
      CancelToken,
      responseMiddleware = (response, info, error) => ({}),
    } = extensionConfig;

    methodConfigs.forEach(methodConfig => {
      if(methodConfig.supportedActions.length <= 1){
        return ;
      }
      let actionTypes = getShared(ActionTypesCreator.$name)[methodConfig.name];
      let actions = getShared(ActionsCreator.$name)[methodConfig.name];
      // console.log('actionTypes :', actionTypes);
      // console.log('actions :', actions);

      let arg = {
        methodName: methodConfig.name,
        names,
      };

      if(!methodConfig.getEpicName || !methodConfig.getUrlTemplate){
        return { shared, exposed };
      }

      const epicName = methodConfig.getEpicName(arg);
      const urlInfo = new UrlInfo(methodConfig.getUrlTemplate({url, names}));

      // special case for posting a collection
      let getRespondActionCreator = createRespondActionCreatorForCollection;
      if(methodConfig.isForCollection !== true){
        getRespondActionCreator = createRespondActionCreatorForMember;
      }else if(methodConfig.method === 'post'){
        getRespondActionCreator = createRespondActionCreatorForPostCollection;
      }

      const getRespondErrorActionCreator = (methodConfig.isForCollection === true) ?
        createRespondErrorActionCreatorForCollection : createRespondErrorActionCreatorForMember;

      shared[methodConfig.name] = (action$, store) => {
        return action$.ofType(actionTypes.start)
          .mergeMap(action => {
            const url = urlInfo.compile(action.entry);
            let cancelToken = CancelToken && new CancelToken();
            if(!cancelToken){
              cancelToken = {
                cancel: () => {},
              }
            }

            const request = {
              method: methodConfig.method,
              path: url,
              // headers: getHeaders(),
              body: action.data,
            };
            return Observable.fromPromise(
              //promiseWait(1000)
              promiseWait(0)
              .then(() =>
                wsProtocol.open()
                .then(() => wsProtocol.request(request, { cancelToken }))
              )
              // .then(({ data }) => {
              //   // console.log('data :', data);
              //   return data;
              // })
              .catch((error) => {
                if(error.response){
                  let result = responseMiddleware(error.response, { request }, error);
                  if(result){
                    return Promise.resolve(result);
                  }
                }
                return Promise.reject(error);
              })
            )
            .map(getRespondActionCreator(actions, action, getId))
            .catch(error => Observable.of(getRespondErrorActionCreator(actions, action)))
            .race(
              action$.filter(action => {
                // TODO checking more conditions for avoiding canceling all action with the same action type
                return action.type === actionTypes.cancel;
              })
                .map(() => {
                  cancelToken.cancel('Operation canceled by the user.');
                  return actions.clearError();
                })
                .take(1)
            )
          })/*
          .mergeMap(action => {
            console.log('action :', action);
            return [action];
          })*/;
      };
      exposed[epicName] = shared[methodConfig.name];
    });
    return { shared, exposed };
  }
}
