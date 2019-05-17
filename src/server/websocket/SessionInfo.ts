/* eslint-disable no-param-reassign, no-console */
import {
  LoggedInSessionConfig,
  LoggedInSession,
  ILoggedInSession,
} from 'login-session-mgr';
import { WsMessageConfig } from 'ricio/ws/index';
import {
  SessionUidType,
} from './common';

export default class UserInfo<
  SessionUid = SessionUidType
> extends LoggedInSession<
  SessionUid
> implements ILoggedInSession<
  SessionUid
> {
  data : any;
  constructor({
    uid,
  } : LoggedInSessionConfig<SessionUid>) {
    super({ uid });
  }
}
