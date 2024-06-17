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

#### Intercom specific fields:
1. Shelly Uni:
    - Status Url: `string` _(required)_
        - URL which retrives the status of the Shelly Uni
    - Talk Url: `string` _(required)_
        - URL which triggers Talk button on the Shelly Uni.
    - Open Url: `string` _(required)_
        - URL which triggers Open button on the Shelly Uni.
    - Buttons timeout: `number` _(optional)_
        - The number of seconds between _pressing_ the Talk button and Open button. Defaults to 1 second.

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
