import { Characteristic, PlatformAccessory, Service } from 'homebridge';

import { IntercomConfig, IntercomPlatform } from './intercomPlatform';
import { ShellyUniDoorbell } from './shellyUni/shellyUniDoorbell';
import { ShellyUniLockMechanism } from './shellyUni/shellyUniLockMechanism';


export class IntercomAccessory {
  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;

  private intercomDoorbell;
  private intercomLockMechanism;

  constructor(
    public readonly platform: IntercomPlatform,
    public readonly accessory: PlatformAccessory,
    public readonly config: IntercomConfig,
  ) {
    this.Service = this.platform.api.hap.Service;
    this.Characteristic = this.platform.api.hap.Characteristic;

    // set accessory information
    const manufacturer = (config.manufacturer === undefined) ? 'Default-Manufacturer' : config.manufacturer;
    const model = (config.model === undefined) ? 'Default-Model' : config.model;
    const serialNumber = (config.serialNumber === undefined) ? 'Default-Serial-Number' : config.serialNumber;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, serialNumber);

    switch (config.intercomType) {
      case 'shellyUni':
        this.intercomDoorbell = new ShellyUniDoorbell(this);
        this.intercomLockMechanism = new ShellyUniLockMechanism(this);
        break;
    }
  }
}