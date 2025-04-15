import { Characteristic, Service } from 'homebridge';
import axios from 'axios';
import http from 'http';

import { IntercomAccessory } from '../intercomAccessory';

export class ShellyUniDoorbell {
  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;
  private displayName = 'Doorbell';
  private ringSensorService;
  private ringSuppressed;
  private server!: http.Server;

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
    this.ringSuppressed = false;

    if (!this.parent.config.shellyUniPollingInterval) {
      this.parent.platform.log.warn('Polling interval is not set, defaulting to 1 second.');
      this.parent.config.shellyUniPollingInterval = 1;
    }

    switch (this.parent.config.shellyUniRingNotificationType) {
      case 'request':
        this.parent.platform.log.info('Request enabled, initializing webhook...');
        this.initializeWebhook();
        break;
      case 'poll':
      default:
        this.parent.platform.log.info('Polling enabled, initializing polling...');
        this.initializePolling();
        break;
    }

    this.parent.platform.log.info('Initialized Shelly Uni Intercom: ', this.parent.accessory.displayName);
  }

  private initializeWebhook() {
    this.server = http.createServer(async (req, res) => {
      if (req.url?.startsWith('/ringing') && req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const status = url.searchParams.get('status');

        if (!status) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Bad Request: Missing status parameter');
          this.parent.platform.log.error('Missing status parameter');
          return;
        }

        this.parent.platform.log.info('Received ringing notification: ' +
          `(ip: ${req.socket.localAddress!}, port: ${req.socket.localPort!})`);
        this.processRingStatus(parseFloat(status!));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    this.server.listen(this.parent.config.shellyUniWebhookPort!, () => {
      this.parent.platform.log.info('Intercom plugin is listening for ringing requests on port:', this.parent.config.shellyUniWebhookPort!);
    });
  }

  private initializePolling() {
    setInterval(async () => {
      const statusData = (await axios.get(this.parent.config.shellyUniStatusUrl!)).data;
      const status = this.parent.config.shellyUniStatusJsonPath!.split('.').reduce((k, v) => {
        return k && k[v];
      }, statusData);

      if (status === undefined) {
        this.parent.platform.log.error('Status value is undefined, please check your configuration');
        return;
      }

      this.parent.platform.log.debug('Checking status of the intercom: ', status);
      this.processRingStatus(parseFloat(status!));
    }, this.parent.config.shellyUniPollingInterval * 1000);
  }

  private processRingStatus(status: number) {
    const statusThreshold = parseFloat(this.parent.config.shellyUniStatusThreshold!);
    if (status < statusThreshold) {
      if (this.ringSensorService.getCharacteristic(this.Characteristic.OccupancyDetected).value ===
        this.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED) {
        this.parent.platform.log.info('Ringing stopped, clear occupancy detected status');
        this.ringSensorService.updateCharacteristic(this.Characteristic.OccupancyDetected,
          this.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
      } else {
        this.parent.platform.log.debug('Status is below threshold, ignoring notification');
      }
      return;
    }

    if (this.ringSuppressed) {
      this.parent.platform.log.debug('Ring suppressed, ignoring notification');
      return;
    }

    this.parent.platform.log.info('Intercom rang');

    this.service.updateCharacteristic(this.Characteristic.ProgrammableSwitchEvent, this.ring());
    this.ringSensorService.updateCharacteristic(this.Characteristic.OccupancyDetected,
      this.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED);

    this.parent.platform.log.info('Ring suppressed for: ', this.parent.config.shellyUniRingSuppressionTimeout, ' seconds');
    this.ringSuppressed = true;

    setTimeout(() => {
      this.ringSuppressed = false;
      this.ringSensorService.updateCharacteristic(this.Characteristic.OccupancyDetected,
        this.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
      this.parent.platform.log.info('Ring suppression timeout ended');
    }, this.parent.config.shellyUniRingSuppressionTimeout! * 1000);
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