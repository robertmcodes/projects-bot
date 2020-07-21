import Discord from 'discord.js'

export default (client: Discord.Client): void => {
  log.info(`Logged in as ${client.user?.tag !== undefined ? client.user.tag : ''}`)

  void client.user?.setPresence({
    status: 'online',
    activity: {
      name: process.env.DISCORD_CLIENT_PRESENCE_MESSAGE,
      type: 'WATCHING'
    }
  })
}
