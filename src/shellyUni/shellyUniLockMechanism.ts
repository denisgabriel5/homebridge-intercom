import { Characteristic, CharacteristicValue, Service } from 'homebridge';
import { IntercomAccessory } from '../intercomAccessory';
import axios from 'axios';

export class ShellyUniLockMechanism {
  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;
  private displayName = 'LockMechanism';
  public service: Service;

  constructor(
    private parent: IntercomAccessory,
  ) {
    this.Service = this.parent.platform.api.hap.Service;
    this.Characteristic = this.parent.platform.api.hap.Characteristic;

    this.service = this.parent.accessory.getService(this.displayName) ||
        this.parent.accessory.addService(this.Service.LockMechanism, this.displayName);

    this.service.setCharacteristic(this.Characteristic.Name, this.displayName);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.Characteristic.LockCurrentState)
      .onGet(this.handleLockCurrentStateGet.bind(this));

    this.service.getCharacteristic(this.Characteristic.LockTargetState)
      .onGet(this.handleLockTargetStateGet.bind(this))
      .onSet(this.handleLockTargetStateSet.bind(this));

    this.service.setCharacteristic(this.Characteristic.LockTargetState, this.Characteristic.LockTargetState.SECURED);
    this.service.setCharacteristic(this.Characteristic.LockCurrentState, this.Characteristic.LockCurrentState.SECURED);
  }

  /**
   * Handle requests to get the current value of the "Lock Current State" characteristic
   */
  handleLockCurrentStateGet() {
    const value = this.service.getCharacteristic(this.Characteristic.LockCurrentState).value;

    this.parent.platform.log.debug('Triggered GET LockCurrentState: ', value);

    return value;
  }


  /**
   * Handle requests to get the current value of the "Lock Target State" characteristic
   */
  handleLockTargetStateGet() {
    const value = this.service.getCharacteristic(this.Characteristic.LockTargetState).value;

    this.parent.platform.log.debug('Triggered GET LockTargetState: ', value);

    return value;
  }

  /**
   * Handle requests to set the "Lock Target State" characteristic
   */
  async handleLockTargetStateSet(value: CharacteristicValue) {
    this.parent.platform.log.debug('Triggered SET LockTargetState: ', value);

    // the door locks automatially so we ignore locking requests altogether
    if (value === this.Characteristic.LockCurrentState.SECURED) {
      return;
    }

    // press the buttons in the specified order
    const buttons = this.parent.config.shellyUniButtonsOrder!.split('-');

    for (let i = 0; i < buttons.length; i++) {
      switch (buttons[i]) {
        case 'open':
          axios.get(this.parent.config.shellyUniOpenUrl!);
          this.parent.platform.log.debug('Intercom Open button pressed');
          break;

        case 'talk':
          axios.get(this.parent.config.shellyUniTalkUrl!);
          this.parent.platform.log.debug('Intercom Talk button pressed');
          break;

        default:
          this.parent.platform.log.error(`Button ${buttons[i]} is wrong!`);
          break;
      }

      if (i === buttons.length - 1) {
        // mark the intercom as open/unlocked/unsecured
        this.service.updateCharacteristic(this.Characteristic.LockTargetState, this.Characteristic.LockCurrentState.UNSECURED);
        this.service.updateCharacteristic(this.Characteristic.LockCurrentState, this.Characteristic.LockCurrentState.UNSECURED);
        this.parent.platform.log.debug('Intercom opened');

        break;
      } else {
        await this.sleep(this.parent.config.shellyUniButtonsTimeout! * 1000);
      }
    }

    // in the end, mark the intercom as closed/locked/secured
    setTimeout(() => {
      this.service.updateCharacteristic(this.Characteristic.LockTargetState, this.Characteristic.LockCurrentState.SECURED);
      this.service.updateCharacteristic(this.Characteristic.LockCurrentState, this.Characteristic.LockCurrentState.SECURED);
      this.parent.platform.log.debug('Intercom closed');
    }, this.parent.config.timeout! * 1000);
  }

  /**
   * Delays the execution for a number of specified seconds
   */
  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}