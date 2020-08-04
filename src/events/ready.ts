import Discord from 'discord.js'

export default (client: Discord.Client): void => {
  log.info(`Logged in as ${client.user?.tag ?? ''}`)

  try {
    void client.user?.setPresence({
      status: 'online',
      activity: {
        name: process.env.DISCORD_CLIENT_PRESENCE_MESSAGE,
        type: 'WATCHING'
      }
    })
  } catch (err) {
    log.error(`Could not set startup presence: ${err}`)
  }
}
