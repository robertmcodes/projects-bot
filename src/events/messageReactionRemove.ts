import Discord from 'discord.js'

export default (client: Discord.Client, reaction: Discord.MessageReaction, user: Discord.User): void => {
  const isNotSelf = user.id !== client?.user?.id
  const isInSubmissionChannel = reaction.message.channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL

  if (isNotSelf && isInSubmissionChannel) {
    // TODO: Check who user is and add downvote or remove
  }
}
