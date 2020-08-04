import Discord, { MessageEmbed } from 'discord.js'
import { Project } from '../typings/interfaces'
import parseSourceUrl from './parseSourceUrl'

export default (project: Project, guild: Discord.Guild): Discord.MessageEmbed => {
  const author = guild.members.cache.get(project.author)

  const name = author
    ? `${author.user.username}#${author.user.discriminator}`
    : `${project.author} (User not found)`

  return new MessageEmbed({
    title: project.name,
    description: project.description,
    url: project.links.source,
    timestamp: new Date(),
    color: 4886754,
    author: {
      name,
      iconURL: author?.user.avatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
    },
    fields: [
      { name: 'Languages/technologies used', value: project.tech },
      { name: 'Source', value: parseSourceUrl(project.links.source), inline: true }, // TODO: Make this fancy
      { name: 'Other links', value: project.links.other, inline: true }
    ]
  })
}
