import Discord from 'discord.js'
import safeSendMessage from '../utils/safeSendMessage'
import { getProject, adjustUpvotesForProject, adjustDownvotesForProject } from '../db'

export default async (client: Discord.Client, reaction: Discord.MessageReaction, user: Discord.User): Promise<Discord.Message | undefined> => {
  // Ensure reaction was not added in DM, even though the ID check would already technically speaking prevent this
  if (reaction.message.guild) {
    const { id, channel, guild } = reaction.message

    const isNotSelf = user.id !== client.user?.id
    const isInSubmissionChannel = channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL
    const isVoteEmoji = reaction.emoji?.id === process.env.UPVOTE_REACTION || reaction.emoji.id === process.env.DOWNVOTE_REACTION

    let projectExists

    try {
      projectExists = !!(await getProject(id))
    } catch (err) {
      return await safeSendMessage(channel, '⚠️ Your vote was not possible to remove. (Failed to validate that message is project)')
    }

    if (isNotSelf && isInSubmissionChannel && projectExists && isVoteEmoji) {
      let member

      // Get reacting member
      try {
        member = await guild?.members.fetch(user.id)
      } catch (err) {
        log.error(`Could not fetch reacting member: ${err}`)
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to remove due to identification failure. (Discord error)')
      }

      // Check that member existed in cache
      if (!member) {
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to remove due to identification failure. (Member not found in guild)')
      }

      // Don't need to check anything more here as checks that the other emoji is a downvote are already performed upstream
      const isUpvote = reaction.emoji.id === process.env.UPVOTE_REACTION

      // Perform actual vote removal operation
      const result = isUpvote
        ? await adjustUpvotesForProject('remove', id, member)
        : await adjustDownvotesForProject('remove', id, member)

      const { success, reason, project } = result

      // Alert of errors during the vote removal process
      if (!success || !project) {
        log.error(`Could not remove ${user.id}'s vote for project ${project?.name} (ID ${project?.id}): ${reason}`)
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to remove. (Internal error)')
      }

      // Don't need to check for approval or rejection here as submissions are deleted upon approval/rejection
      // and a removal of a vote can never push a project beyond a positive threshold

      log.info(`User ${user.id} (${user.tag}) removed their ${isUpvote ? 'upvote' : 'downvote'} for project ${project.name} (ID ${project.id})`)
    }
  }
}
