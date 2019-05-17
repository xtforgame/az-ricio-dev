/* eslint-disable no-console */
export default class WsPeerManager<WsPeer> {
  wsPeerMap : Map<any, WsPeer>;
  constructor() {
    this.wsPeerMap = new Map<any, WsPeer>();
  }
}
