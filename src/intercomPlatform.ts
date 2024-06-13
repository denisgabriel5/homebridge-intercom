import { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service, Characteristic, UnknownContext }
  from 'homebridge';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { IntercomAccessory } from './intercomAccessory.js';

export interface IntercomConfig extends PlatformConfig {
  name?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  timeout?: number;
  intercomType?: string;
  shellyUniStatusUrl?: string;
  shellyUniTalkUrl?: string;
  shellyUniOpenUrl?: string;
  buttonsTimeout?: number;
}

/**
 * IntercomPlatform
 * This class is the main constructor for the plugin, this is where
 * we parse the user config and register the intercom with Homebridge.
 */
export class IntercomPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: IntercomConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', PLATFORM_NAME);

    // Homebridge 1.8.0 introduced a `log.success` method that can be used to log success messages
    // For users that are on a version prior to 1.8.0, we need a 'polyfill' for this method
    if (!log.success) {
      log.success = log.info;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to register new intercoms
      this.discoverNewIntercom(this.config);
    });
  }

  configureAccessory(accessory: PlatformAccessory<UnknownContext>): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  discoverNewIntercom(config: IntercomConfig) {
    switch (config.intercomType) {
      case 'shellyUni':
        this.registerShellyUniIntercom(config);
        break;

      default:
        this.log.error('Cannot register intercom of type None');
        break;
    }
  }

  registerShellyUniIntercom(config: IntercomConfig) {
    // generate a unique id for the intercom from the URL used to get the status of ShellyUni
    const uuid = this.api.hap.uuid.generate(config.shellyUniStatusUrl!);

    // see if an intercom with the same uuid has already been registered and restored from
    // the cached intercoms we stored in the `configureAccessory` method above
    const existingIntercomAccessory = this.accessories.find(intercom => intercom.UUID === uuid);

    if (existingIntercomAccessory) {
      this.log.info('Restoring existing intercom from cache:', config.name);

      // create the intercom handler for the restored intercom
      new IntercomAccessory(this, existingIntercomAccessory, config);
    } else {
      // the intercom does not yet exist, so we need to create it
      this.log.info('Registering new intercom:', config.name);

      // create a new intercom
      const newIntercomAccessory = new this.api.platformAccessory(config.name!, uuid);

      // create the intercom handler for the newly create intercom
      new IntercomAccessory(this, newIntercomAccessory, config);

      // link the intercom to our platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [newIntercomAccessory]);
    }
  }
}