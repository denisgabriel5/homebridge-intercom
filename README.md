<p align="center">
  <a href="https://homebridge.io"><img src="https://raw.githubusercontent.com/homebridge/branding/latest/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# Homebridge Intercom Plugin

[![npm](https://badgen.net/npm/v/homebridge-intercom)](https://www.npmjs.com/package/homebridge-intercom)
[![npm](https://badgen.net/npm/dt/homebridge-intercom?label=downloads)](https://www.npmjs.com/package/homebridge-intercom)
<a href="https://github.com/denisgabriel5/homebridge-intercom/actions/workflows/build.yml"><img title="Node Build" src="https://github.com/denisgabriel5/homebridge-intercom/actions/workflows/build.yml/badge.svg"></a>

</span>

## Overview

**Homebridge Intercom** is a plugin for [Homebridge](https://github.com/homebridge/homebridge) that enables integration with old intercoms. This allows you to control and monitor your intercom system directly from your Home app.

## Features

* **Notifications**: Receive notifications when someone rings your intercom.
* **Door control**: Unlock the door connected to your intercom.
* **Automations**: Create automatizations whne the intercom rings, via an Occupancy Sensor exposed in the Home app.

## Installation Instructions

If you have installed Homebridge UI, then you can install the plugin from the Homebridge Plugins screen by searching for `homebridge-intercom`. If not, then you can install it by running this command:

```
sudo npm install -g homebridge-intercom
```

## Usage

### Configuration

In order to configure the intercom you will need to fill the following fields:

#### Intercom general fields:

- Name: `string` _(required)_
    - The name that will appear in your homebridge log.
- Manufacturer: `string` _(optional)_
    - What will show under Manufacturer in accessory settings.
- Model: `string` _(optional)_
    - What will show under Model in accessory settings.
- Serial Number: `string` _(optional)_
    - What will show under Serial Number in accessory settings.
- Timeout: `number` _(optional)_
    - The number of seconds between the unlocking and locking notifications. Defaults to 10 seconds.
- Intercom type: `string` _(required)_
    - The intercom communication with Homebridge is done directly with the intercom or indirectly. When done indirectly, an interface will be used, such as Raspberry Pi or Shelly.  
    As of now, these are the supported ways of communication:
        - Shelly Uni _(indirectly)_

        _Note: Please open an issue if you would like support added for your intercom._

#### Intercom Specific Fields:

1. Shelly Uni:

- Ring Notification Type: `string` _(required)_
  - Choose how the plugin should detect ringing:
    - `request`: Exposes a webhook that the Shelly Uni calls.
    - `poll`: Polls a Shelly Uni endpoint for it's ringing status.
  - Defaults to `poll`.
- Webhook Port: `number` _(required if using `request` notification type)_
  - The port on which the webhook will listen for `http://homebridge.ip:port/ringing?status=$value` calls.
  - **Note:** If you're Homebridge in Docker you must expose this port to the host.
  - Defaults to `9000`.
  - `request` specific field.
- Status URL: `string` _(required if using `poll` notification type)_
  - URL which retrieves the status of the Shelly Uni.
  - `poll` specific field.
- Status JSON Path: `string` _(required if using `poll` notification type)_
  - Path in the JSON structure to the field that changes upon ringing.
  - `poll` specific field.
- Poll Interval: `number` _(required if using `poll` notification type)_
  - The interval in seconds at which the plugin polls the endpoint for ringing status.
  - Defaults to `1`.
  - `poll` specific field.
- Status Threshold: `number` _(required)_
  - The minimum value considered as a ringing trigger for `poll` or `request` methods.
- Talk URL: `string` _(required)_
  - URL which triggers the Talk button on the Shelly Uni.
- Open URL: `string` _(required)_
  - URL which triggers the Open button on the Shelly Uni.
- Buttons Pressing Order: `string` _(required)_
  - Some intercoms require different pressing orders. The default one is pressing the Talk button, then the Open button, but others might require an additional press of the Talk or Open button.
  - Defaults to `open-talk`.
- Buttons Timeout: `number` _(required)_
  - The number of seconds between "pressing" the buttons. Defaults to `1` second.
- Ring Suppression Timeout: `number` _(required)_
  - The number of seconds to ignore any other changes in the status of the Shelly Uni (changes that imply that the intercom is ringing).

### Description

Once configured, your intercom system will be accessible through the Home app. 

You will have one accessory (the Intercom) which will encompass 3 accessories:
- 1 Doorbell;
- 1 Locking Mechanism;
- 1 Occupancy Sensor (this will be useful in automations to detect when the Intercom is ringing).

When someone will ring the intercom, the Doorbell will sent a notifications to all your Apple devices. Then to open the door, you will have to use the unlock switch, which is present in the Intercom accessory.

If you want you can automatize the opening of the door by using the Occupancy Sensor. This sensor will get triggered everytime the Intercom rings. You will still get the ringing notification, as well as unlocking/locking the door notifications.

## License

This project is licensed under the Apache-2.0 license - see the [LICENSE](LICENSE) file for details.
