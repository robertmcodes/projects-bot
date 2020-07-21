import { ClientEvents } from 'discord.js'
import ready from './ready'
import message from './message'
import messageReactionAdd from './messageReactionAdd'
import messageReactionRemove from './messageReactionRemove'

const events: { [key in keyof ClientEvents]?: Function } = {
  ready,
  message,
  messageReactionAdd,
  messageReactionRemove
}

export default events
