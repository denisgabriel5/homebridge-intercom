import { Characteristic, Service } from 'homebridge';
import axios from 'axios';

import { IntercomAccessory } from '../intercomAccessory';

export class ShellyUniDoorbell {
  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;
  private displayName = 'Doorbell';
  private ringSensorService;

  public service: Service;

  constructor(
    private parent: IntercomAccessory,
  ) {
    this.Service = this.parent.platform.api.hap.Service;
    this.Characteristic = this.parent.platform.api.hap.Characteristic;

    // create or find an exisitng service for a doorbell
    this.service = this.parent.accessory.getService(this.displayName) ||
      this.parent.accessory.addService(this.Service.Doorbell, this.displayName);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent)
      .onGet(this.handleProgrammableSwitchEventGet.bind(this));

    // create or find an exisitng service for a occupancy sensor, which will be used in automations to signal when the intercom is ringing
    this.ringSensorService = this.parent.accessory.getService('Intercom Ring Sensor') ||
      this.parent.accessory.addService(this.Service.OccupancySensor, 'Intercom Ring Sensor');

    // create handlers for required characteristics
    this.ringSensorService.getCharacteristic(this.Characteristic.OccupancyDetected)
      .onGet(this.handleOccupancyDetectedGet.bind(this));

    this.parent.platform.log.debug('Started checking the intercom');

    // continously check the status of the intercom
    setInterval(async () => {
      const statusData = (await axios.get(this.parent.config.shellyUniStatusUrl!)).data;
      const status = this.parent.config.shellyUniStatusJsonPath!.split('.').reduce((k, v) => {
        return k && k[v];
      }, statusData);

      if (status > this.parent.config.shellyUniStatusThreshold! &&
        !this.ringSensorService.getCharacteristic(this.Characteristic.OccupancyDetected).value) {
        this.parent.platform.log.debug('Intercom rang');

        this.service.updateCharacteristic(this.Characteristic.ProgrammableSwitchEvent, this.ring());
        this.ringSensorService.updateCharacteristic(this.Characteristic.OccupancyDetected,
          this.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED);
      }

      if (status < this.parent.config.shellyUniStatusThreshold!) {
        this.ringSensorService.updateCharacteristic(this.Characteristic.OccupancyDetected,
          this.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
      }
    }, 1000);
  }

  /**
   * This is a little hack in order to trigger the ProgrammableSwitchEvent
   */
  ring() {
    return !this.service.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent).value;
  }

  /**
   * Handle requests to get the current value of the "Programmable Switch Event" characteristic
   */
  handleProgrammableSwitchEventGet() {
    const value = this.service.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent).value;

    this.parent.platform.log.debug('Triggered GET ProgrammableSwitchEvent: ', value);

    return value;
  }

  /**
   * Handle requests to get the current value of the "Occupancy Detected" characteristic
   */
  handleOccupancyDetectedGet() {
    const value = this.ringSensorService.getCharacteristic(this.Characteristic.OccupancyDetected).value;

    this.parent.platform.log.debug('Triggered GET OccupancyDetected: ', value);

    return value;
  }

}