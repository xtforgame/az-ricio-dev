/* eslint-disable no-console */
import { AzWsMessageCtx } from 'ricio/ws/server/api';
import WsPeer from './WsPeer';
import WsPeerManager from './WsPeerManager';
import PeerClass from './PeerClass';

export type WsCtx = AzWsMessageCtx<
  PeerClass<
    WsPeer,
    WsPeerManager<WsPeer>
  >
>;
