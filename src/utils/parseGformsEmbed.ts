// Parses the Google Forms embed to a more malleable data structure

import Discord from 'discord.js'
import { ProjectSubmission } from '../typings/interfaces'

export default (message: Discord.Message): ProjectSubmission => {
  const embed = message.embeds[0]
  const { fields } = embed

  return {
    id: message.id,
    // The else will never happen here as the title is a required argument on all levels; this is just here to satisfy TS
    name: embed.title !== undefined ? embed.title : 'Untitled',
    author: fields[0].value,
    description: fields[1].value,
    links: {
      source: fields[2].value,
      other: fields[3].value
    },
    tech: fields[4].value
  }
}
