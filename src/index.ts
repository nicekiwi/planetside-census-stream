import { MessageType, NamespaceType, ServiceType, StreamEventType } from 'planetside-census-data'
import { EventEmitter } from 'events'
import Websocket from 'ws'

export interface IStreamResponse {
  type: MessageType
  service: ServiceType
}

export interface IHeartbeatResponse extends IStreamResponse {
  type: MessageType.HEARTBEAT
  service: ServiceType.EVENT
  online: Record<string, 'true' | 'false'>
}

export interface IServiceMessageResponse<P = IStreamPayload> extends IStreamResponse {
  type: MessageType.SERVICE_MESSAGE
  service: ServiceType.EVENT
  payload: P
}

export interface IServiceStateChangeResponse extends IStreamResponse {
  type: MessageType.SERVICE_STATE_CHANGE
  service: ServiceType.EVENT
  state: 'online' | 'offline'
}

export interface IConnectionStateChangeResponse extends IStreamResponse {
  type: MessageType.CONNECTION_STATE_CHANGED
  service: ServiceType.PUSH
  connected: 'true' | 'false'
}

export interface IStreamPayload {
  event_name: StreamEventType
  timestamp: string
}

export interface IPlayerLoginPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_LOGIN
  character_id: string
  world_id: string
}

export interface IPlayerLogoutPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_LOGOUT
  character_id: string
  world_id: string
}

export interface IMetagameEventPayload extends IStreamPayload {
  event_name: StreamEventType.ZONE_METAGAME_EVENT
  timestamp: string
  world_id: string
  experience_bonus: string
  instance_id: string
  faction_nc: string
  faction_tr: string
  faction_vs: string
  metagame_event_id: string
  metagame_event_state: string
  metagame_event_state_name: 'started' | 'ended'
  zone_id: string
}

export interface IContinentLockPayload extends IStreamPayload {
  event_name: StreamEventType.ZONE_LOCK
  timestamp: string
  world_id: string
  zone_id: string
  triggering_faction: string
  previous_faction: string
  vs_population: string
  nc_population: string
  tr_population: string
  metagame_event_id: string
  event_type: string
}

export interface IDeathPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_DEATH
  attacker_character_id: string
  attacker_fire_mode_id: string
  attacker_loadout_id: string
  attacker_vehicle_id: string
  attacker_weapon_id: string
  attacker_team_id: string
  character_id: string
  character_loadout_id: string
  is_critical: string
  is_headshot: string
  timestamp: string
  vehicle_id: string
  world_id: string
  zone_id: string
}

export interface IAchievementEarnedPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_ACHIEVEMENT_EARNED
  character_id: string
  timestamp: string
  world_id: string
  achievement_id: string
  zone_id: string
}

export interface IFacilityControlPayload extends IStreamPayload {
  event_name: StreamEventType.ZONE_FACILITY_CONTROL
  duration_held: string
  facility_id: string
  new_faction_id: string
  old_faction_id: string
  outfit_id: string
  timestamp: string
  world_id: string
  zone_id: string
}

export interface IVehicleDestroyPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_VEHICLE_DESTROY
  attacker_character_id: string
  attacker_loadout_id: string
  attacker_vehicle_id: string
  attacker_weapon_id: string
  character_id: string
  facility_id: string
  faction_id: string
  timestamp: string
  vehicle_id: string
  world_id: string
  zone_id: string
}

export interface IGainExperiencePayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_GAIN_XP
  amount: string
  character_id: string
  experience_id: string
  loadout_id: string
  other_id: string
  timestamp: string
  world_id: string
  zone_id: string
}

export interface IBattleRankUpPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_BATTLE_RANK_UP
  battle_rank: string
  character_id: string
  timestamp: string
  world_id: string
  zone_id: string
}

export interface IItemAddedPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_ITEM_ADDED
  character_id: string
  context: string
  item_count: string
  item_id: string
  timestamp: string
  world_id: string
  zone_id: string
}

export interface IPlayerFacilityCapturePayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_FACILITY_CAPTURE
  character_id: string
  facility_id: string
  outfit_id: string
  timestamp: string
  world_id: string
  zone_id: string
}

export interface IPlayerFacilityDefendPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_FACILITY_DEFEND
  character_id: string
  facility_id: string
  outfit_id: string
  timestamp: string
  world_id: string
  zone_id: string
}

export interface ISkillAddedPayload extends IStreamPayload {
  event_name: StreamEventType.CHARACTER_SKILL_ADDED
  character_id: string
  skill_id: string
  timestamp: string
  world_id: string
  zone_id: string
}

export const streamUrl = 'push.planetside2.com/streaming'

export const streamUrlWss = 'wss://push.planetside2.com/streaming'

export function streamUrlComplete(namespace: NamespaceType, serviceId: string): string {
  return `${streamUrlWss}?environment=${namespace}&service-id=s:${serviceId}`
}

export class CensusStream extends EventEmitter {
  private readonly ws!: Websocket

  constructor(
    private readonly platform: NamespaceType,
    private readonly serviceId: string
  ) {
    super()

    this.ws = new Websocket(streamUrlComplete(this.platform, this.serviceId))

    this.ws.once('open', () => this.emit('open'))
    this.ws.on('message', (data: string) => {
      this.onData(data)
    })

    this.handleTypes()
  }

  private onData(data: string): void {
    try {
      this.emit('data', JSON.parse(data))
    } catch (e) {
      console.debug('JSON data is not valid', e, data)
    }
  }

  private handleTypes(): void {
    this.on('data', (data: IHeartbeatResponse | IServiceMessageResponse) => {
      const type = data.type

      if (type === MessageType.HEARTBEAT) {
        this.emit('heartbeat', data)
      } else if (type === MessageType.SERVICE_MESSAGE) {
        this.emit(data.payload.event_name, data)
      }
    })
  }

  subscribe(
    worlds: number[],
    eventNames: string[],
    characters: string[] = ['all'],
    logicalAndCharactersWithWorlds = false
  ): void {
    const payload = {
      service: 'event',
      action: 'subscribe',
      worlds,
      eventNames,
      characters,
      logicalAndCharactersWithWorlds,
    }

    try {
      this.ws.send(JSON.stringify(payload))
    } catch (e) {
      console.debug('Failed Subscribing to Event', e, payload)
    }
  }

  unsubscribe(worlds = [], eventNames: string[], characters = ['all']): void {
    const payload = {
      service: 'event',
      action: 'clearSubscribe',
      worlds,
      characters,
      eventNames,
    }

    try {
      this.ws.send(JSON.stringify(payload))
    } catch (e) {
      console.debug('Failed Unsubscribing to Event', e, payload)
    }
  }

  unsubscribeAll(): void {
    const payload = {
      service: 'event',
      action: 'clearSubscribe',
      all: 'true',
    }

    try {
      this.ws.send(JSON.stringify(payload))
    } catch (e) {
      console.debug('Failed Unsubscribing to Event', e, payload)
    }
  }
}

export default CensusStream
