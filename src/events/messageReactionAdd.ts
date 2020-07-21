import Discord from 'discord.js'

export default (client: Discord.Client, reaction: Discord.MessageReaction, user: Discord.User): void => {
  const isInSubmissionChannel = reaction.message.channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL

  if (isInSubmissionChannel) {
    // TODO: Check who user is and add vote or approve
  }
}
