import Discord, { TextChannel } from 'discord.js'
import safeSendMessage from '../utils/safeSendMessage'
import { getProject, adjustUpvotesForProject, adjustDownvotesForProject, pause } from '../db'
import showcase, { ShowcaseInput } from '../utils/showcase'

export default async (client: Discord.Client, reaction: Discord.MessageReaction, user: Discord.User): Promise<Discord.Message | undefined> => {
  // Ensure reaction was not added in DM, even though the ID check would already technically speaking prevent this
  if (reaction.message.guild) {
    const { id, channel, guild } = reaction.message

    const isNotSelf = user.id !== client.user?.id
    const isInSubmissionChannel = channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL
    const isValidEmoji = reaction.emoji?.id === process.env.UPVOTE_REACTION || 
      reaction.emoji?.id === process.env.DOWNVOTE_REACTION ||
      reaction.emoji?.name === process.env.PAUSE_REACTION

    let projectExists

    try {
      projectExists = !!(await getProject(id))
    } catch (err) {
      return await safeSendMessage(channel, '⚠️ Your vote was not possible to register. (Failed to validate that message is project)')
    }

    if (isNotSelf && isInSubmissionChannel && projectExists && isValidEmoji) {
      let member

      // Get reacting member
      try {
        member = await guild?.members.fetch(user.id)
      } catch (err) {
        log.error(`Could not fetch reacting member: ${err}`)
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to register due to identification failure. (Discord error)')
      }

      // Check that member existed in cache
      if (!member) {
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to register due to identification failure. (Member not found in guild)')
      }

      // Don't need to check anything more here as checks that the other emoji is a downvote are already performed upstream
      const isUpvote = reaction.emoji.id === process.env.UPVOTE_REACTION
      const isDownvote = reaction.emoji.id === process.env.DOWNVOTE_REACTION
      const isPause = reaction.emoji.name === process.env.PAUSE_REACTION


      // Perform actual vote operation
      const result = isUpvote
        ? await adjustUpvotesForProject('add', id, member)
        : isPause 
          ? await pause('up', id, member) :
            await adjustDownvotesForProject('add', id, member)
      
      await showcase({
        result,
        isUpvote,
        isPause,
        isDownvote,
        guild,
        channel,
        user,
        reaction
      } as ShowcaseInput)
    }
  }
}
