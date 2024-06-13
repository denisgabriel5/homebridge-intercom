import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings.js';
import { IntercomPlatform } from './intercomPlatform.js';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, IntercomPlatform);
};
