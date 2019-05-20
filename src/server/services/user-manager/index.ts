import ServiceBase from '../ServiceBase';
import GenericUserSessionManager from './GenericUserSessionManager';
import {
  PeerClassType,
} from '~/websocket/index';

export default class UserManager extends ServiceBase {
  static $name = 'userManager';

  static $type = 'service';

  static $inject = [];

  userSessionManager : GenericUserSessionManager<PeerClassType>;
  constructor() {
    super();
    this.userSessionManager = new GenericUserSessionManager<PeerClassType>();
  }

  onStart() {
  }
}
