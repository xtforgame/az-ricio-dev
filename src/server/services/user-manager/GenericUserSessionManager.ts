/* eslint-disable no-param-reassign, no-console */
import { UserSessionManager, LogoutReason } from 'login-session-mgr';
import {
  SessionUidType,
  UserUidType,
  ChannelUidType,
  SessionInfo,
  UserInfo,
  PeerClass,
  WsPeer,
  WsPeerManager,
} from '~/websocket/index';
import ChannelManager from './ChannelManager';
import fakeUserManager from '../../utils/fakeUserManager';

export type MyPeer = PeerClass<WsPeer, WsPeerManager<WsPeer>>;

export default class GenericUserSessionManager {
  userSessionCounters : any;
  chManager : ChannelManager<ChannelUidType, UserUidType, UserInfo>;
  userSessionMgr : UserSessionManager<
    SessionUidType,
    SessionInfo,
    UserUidType,
    UserInfo
  >;
  allPeers : Map<any, MyPeer>;

  constructor() {
    this.userSessionCounters = {};
    this.chManager = new ChannelManager<ChannelUidType, UserUidType, UserInfo>();
    this.allPeers = new Map<any, MyPeer>();
    this.userSessionMgr = new UserSessionManager<
      SessionUidType,
      SessionInfo,
      UserUidType,
      UserInfo
    >({
      UserInfoClass: UserInfo,
      onSessionLoggedIn: ((newSession) => {
        // console.log('=================== newSession :', newSession);
        newSession.data.rcPeer.setSession(newSession);
      }),
      onUserLoggedIn: ((newUser) => {
        newUser.data.userSessionManager = this;
        // console.log('=================== newUser :', newUser);
      }),
      onSessionLoggedOut: ((existedSession, reason) => {
      }),
      onUserLoggedOut: ((existedUser) => {
      }),
      onSessionUnexpectedLoggedOut: ((existedSession, reason) => {
      }),
      onSessionReloggedIn: ((reloggedInSession, newData) => {
      }),
      onSessionDuplicateLogin: ((existedSession, newSession, logoutExistedOne, denyLogin) => {
        denyLogin();
        logoutExistedOne();
      }),
    });

    // setInterval(() => {
    //   this.debugReportPeerInfo();
    // }, 2000);
  }

  addPeer(rcPeer : MyPeer) {
    const wsPeer = rcPeer.getWsPeer();
    if (wsPeer) {
      this.allPeers.set(rcPeer.getWsPeer(), rcPeer);
    }
  }

  loginWithToken(rcPeer : MyPeer, token : any) {
    // const session = fakeUserManager.authenticateFromToken(data.token);
    const session = fakeUserManager.verify(token);
    if (session) {
      console.log('session.user_id :', session.user_id);
      this.userSessionCounters[session.user_id] = this.userSessionCounters[session.user_id]
        ? this.userSessionCounters[session.user_id] + 1 : 1;

      const wsSessionNumber = this.userSessionCounters[session.user_id];
      const wsSession = fakeUserManager.authenticateFromToken(token, { wsSessionNumber });

      return this.userSessionMgr.login(wsSession.user_id, wsSession.token, {
        session,
        rcPeer,
      })
      .then(() => wsSession);
    }
    return Promise.reject();
  }

  loginWithPassword(rcPeer : MyPeer, body : any) {
    const { auth_type, password, username } = body;
    return Promise.resolve(fakeUserManager.authenticate(auth_type, username, password));
  }

  get userMap() {
    return this.userSessionMgr.userMap;
  }

  mapUser(
    inFn : (
      user: UserInfo,
      userUid : UserUidType,
      map : Map<UserUidType, UserInfo>,
    ) => any,
  ) : any[] {
    const fn = inFn || (() => {});
    const result : any[] = [];
    this.userMap.forEach((user, userUid, map) => {
      result.push(fn(user, userUid, map));
    });
    return result;
  }

  findUser(uid : UserUidType) {
    return this.userMap.get(uid);
  }

  peerJoinChannel(user : UserInfo, channelArray : any) {
    const result = this.chManager.join(user, channelArray);
    user.data.channelMap = this.chManager.getUserMetadata(user);
    return result;
  }

  peerLeaveChannel(user : UserInfo, channelArray : any) {
    const result = this.chManager.leave(user, channelArray);
    user.data.channelMap = this.chManager.getUserMetadata(user);
    return result;
  }

  peerLeaveAllChannel(user : UserInfo) {
    const result = this.chManager.leaveAll(user);
    user.data.channelMap = this.chManager.getUserMetadata(user);
    return result;
  }

  channelRemoveAllPeers(channel : any) {
    return this.chManager.removeAll(channel);
  }

  isPeerInChannel(user : UserInfo, channel : any) {
    return this.chManager.isInChannel(user, channel);
  }

  getPeerChannelList(user : UserInfo) {
    return (this.chManager.getUserMetadata(user) || []).map((value : any) => value);
  }

  removePeer(rcPeer : MyPeer) {
    const wsPeer = rcPeer.getWsPeer();
    if (wsPeer) {
      this.allPeers.delete(rcPeer.getWsPeer());
    }
  }

  logout(rcPeer : MyPeer, reason: LogoutReason = '') {
    this.removePeer(rcPeer);
    const sessionId = rcPeer.getSessionId();
    if (sessionId) {
      // console.log('removePeer');
      return this.userSessionMgr.logout(sessionId, reason);
    }
    return Promise.resolve();
  }

  unexpectedLogout(rcPeer : MyPeer) {
    console.log('unexpectedLogout');
    this.removePeer(rcPeer);
    const sessionId = rcPeer.getSessionId();
    if (sessionId) {
      return this.userSessionMgr.unexpectedLogout(sessionId, 'ConnectionLost');
    }
    return Promise.resolve();
  }

  debugReportPeerInfo() {
    console.log('================ [debug] ReportPeerInfo ================');
    console.log('================         Users          ================');
    this.allPeers.forEach((rcPeer, key, map) => {
      rcPeer.debugPrintProfile();
    });
    console.log('================        Channels        ================');
    this.chManager.debugPrintProfile();
    console.log('================ [debug] ReportPeerInfo ================');
  }
}
