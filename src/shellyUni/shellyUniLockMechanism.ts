import { Characteristic, CharacteristicValue, Service } from 'homebridge';
import { IntercomAccessory } from '../intercomAccessory';
import axios from 'axios';

export class ShellyUniLockMechanism {
  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;
  private displayName = 'LockMechanism';
  // private targetState: CharacteristicValue;
  // private currentState: CharacteristicValue;
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
  handleLockTargetStateSet(value: CharacteristicValue) {
    this.parent.platform.log.debug('Triggered SET LockTargetState: ', value);

    // the door locks automatially so we ignore locking requests altogether
    if (value === this.Characteristic.LockCurrentState.SECURED) {
      return;
    }

    // in order to open the intercom door you must press the talking button and then the open door button
    // so press the talk button with the following setTimeout
    setTimeout(async () => {
      await axios.post(this.parent.config.shellyUniTalkUrl!);
      this.parent.platform.log.debug('Intercom talk button pressed');
    }, 0);

    // and after roughly 1 second press the second button and also mark the intercom as open/unlocked/unsecured
    setTimeout(async () => {
      await axios.post(this.parent.config.shellyUniOpenUrl!);
      this.parent.platform.log.debug('Intercom open button pressed');
      this.service.updateCharacteristic(this.Characteristic.LockTargetState, this.Characteristic.LockCurrentState.UNSECURED);
      this.service.updateCharacteristic(this.Characteristic.LockCurrentState, this.Characteristic.LockCurrentState.UNSECURED);
      this.parent.platform.log.debug('Intercom opened');
    }, this.parent.config.shellyUniButtonsTimeout! * 1000);

    // in the end mark the intercom as closed/locked/secured
    setTimeout(() => {
      this.service.updateCharacteristic(this.Characteristic.LockTargetState, this.Characteristic.LockCurrentState.SECURED);
      this.service.updateCharacteristic(this.Characteristic.LockCurrentState, this.Characteristic.LockCurrentState.SECURED);
      this.parent.platform.log.debug('Intercom closed');
    }, this.parent.config.timeout! * 1000);
  }
}