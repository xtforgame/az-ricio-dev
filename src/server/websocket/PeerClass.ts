/* eslint-disable no-console */
import RicioPeer, { IRcPeerManager } from 'ricio/RicioPeer';
import { IWsPeer, IWsPeerManager } from 'ricio/WsPeer';

import {
  SessionUidType,
  UserUidType,
} from '~/websocket/common';

let hashCounter = 0;

export default class PeerClass<WsPeer extends IWsPeer, WsPeerManager extends IWsPeerManager<WsPeer>>
  extends RicioPeer<WsPeer, WsPeerManager>
{
  hash : number;

  constructor(rcPeerManager: IRcPeerManager<WsPeer, WsPeerManager>, option: any) {
    super(rcPeerManager, option);
    this.hash = ++hashCounter;
  }

  getUserId() : UserUidType {
    return this.session && this.session.user_id;
  }

  broadcast = (msg : any) => Promise.all(
    (<any>this.rcPeerManager).userSessionManager.mapUser(((user : any) => user.send(msg)))
  );

  channelBroadcast = (channel : any, msg : any, options : any = {}) : any => {
    if (Array.isArray(channel)) {
      return Promise.all(channel.map(ch => this.channelBroadcast(ch, msg, options)));
    }
    const {
      includeSender = false,
      filter,
    } = options;

    const channelMetadata = (<any>this.rcPeerManager).userSessionManager.chManager.getChannelMetadata(channel);
    if (!channelMetadata) {
      return Promise.reject(new Error('Channel not found'));
    }

    const me = this.getUser();
    const myUserId = me && me.uid;
    if (!myUserId) {
      return Promise.reject(new Error('User not found'));
    }

    const userFilter = filter || (includeSender ? ((u : any) => u) : ((u : any) => u.uid !== myUserId));

    return Promise.all(channelMetadata.map((u : any) => u)
      .filter(userFilter)
      .map((user : any) => user.send(msg)));
  };

  debugPrintProfile() {
    const user = this.getUser();
    console.log(`user: ${user ? /* user.uid */ user.data.name : '<Unauthenticated>'} (hash: ${this.hash})`);
  }
}
