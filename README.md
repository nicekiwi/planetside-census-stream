# Planetside Census Stream

An API wrapper to access events of the game Planetside 2.

## Usage

```ts
import CensusStream from 'planetside-census-stream';
import { NamespaceType, StreamEventType } from 'planetside-census-data';

const stream = new CensusStream(
  platform: NamespaceType.PC,
  serviceId: 's:example'
);

stream.on('open', () => {
  console.log('Connected to Census stream');

  stream.subscribe(
    worlds: [WorldType.CONNERY],
    eventNames: [StreamEventType.CHARACTER_DEATH]
  );

  console.log('Subscribed to character Death events on Connery');
});

stream.on(StreamEventType.CHARACTER_DEATH, (data: ServiceMessageResponse<DeathPayload>) => {
  console.log(data);
});

// Connected to Census stream
// Subscribed to character Death events on Connery
// {
//   "payload":{
//     "attacker_character_id":"5429026007696236657","attacker_fire_mode_id":"24103",
//     "attacker_loadout_id":"1",
//     "attacker_team_id":"2",
//     "attacker_vehicle_id":"0",
//     "attacker_weapon_id":"24003","character_id":"5429152843598287233","character_loadout_id":"32",
//     "event_name":"Death",
//     "is_critical":"0",
//     "is_headshot":"0",
//     "team_id":"1",
//     "timestamp":"1681105322",
//     "world_id":"1",
//     "zone_id":"8"
//   },
//   "service":"event",
//   "type":"serviceMessage"
// }

```

Based on: https://github.com/Planetside-Community-Devs/planetside-stream-api
