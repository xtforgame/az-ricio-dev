/* eslint-disable no-param-reassign, no-console */
import {
  LoggedInUser,
  LoggedInUserConfig,
  LoggedInSession,
  ILoggedInSession,
  ILoggedInUser,
} from 'login-session-mgr';
import { WsMessageConfig } from 'ricio/ws/index';
import {
  UserUidType,
  SessionUidType,
} from './common';
import RealSessionInfo from './SessionInfo';

export default class UserInfo<
  UserUid = UserUidType,
  SessionUid = SessionUidType,
  SessionInfo = LoggedInSession<SessionUid>
> extends LoggedInUser<
  UserUid,
  SessionUid,
  SessionInfo
> implements ILoggedInUser<
  SessionInfo,
  UserUid,
  SessionUid
> {
  data : any;
  constructor({
    uid,
  } : LoggedInUserConfig<UserUid>) {
    super({ uid });
    this.data = {};
    this.data.channelMap = null;
  }

  get userSessionManager() {
    return this.data.userSessionManager;
  }

  castSession(s : SessionInfo) : RealSessionInfo {
    return <RealSessionInfo><any>s;
  }

  mapSession(
    inFn : (
      session: SessionInfo,
      sessionUid : SessionUid,
      map : Map<SessionUid, SessionInfo>,
    ) => any,
  ) : any[] {
    const fn = inFn || (() => {});
    const result : any[] = [];
    this.sessionMap.forEach((session, sessionUid, map) => {
      result.push(fn(session, sessionUid, map));
    });
    return result;
  }

  send(msg : WsMessageConfig) {
    return this.mapSession(session => this.castSession(session).data.rcPeer.send(msg));
  }

  joinChannel(channelArray : any) {
    return this.userSessionManager.peerJoinChannel(this, channelArray);
  }

  leaveChannel(channelArray : any) {
    return this.userSessionManager.peerLeaveChannel(this, channelArray);
  }

  inChannel(channel : any) {
    return this.userSessionManager.isPeerInChannel(this, channel);
  }
}
