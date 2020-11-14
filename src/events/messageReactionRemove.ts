import Discord from 'discord.js'
import safeSendMessage from '../utils/safeSendMessage'
import { getProject, adjustUpvotesForProject, adjustDownvotesForProject, suspendVotingForProject } from '../db'
import showcase from '../utils/postShowcase'
import { ShowcaseDiscordData, ShowcaseData } from '../typings/interfaces'

export default async (client: Discord.Client, reaction: Discord.MessageReaction, user: Discord.User): Promise<Discord.Message | undefined> => {
  // Ensure reaction was not added in DM, even though the ID check would already technically speaking prevent this
  if (reaction.message.guild) {
    const { id, channel, guild } = reaction.message
    const { emoji } = reaction

    const isNotSelf = user.id !== client.user?.id
    const isInSubmissionChannel = channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL
    const isValidEmoji = emoji.id === process.env.UPVOTE_REACTION ||
      emoji.id === process.env.DOWNVOTE_REACTION ||
      emoji.name === process.env.PAUSE_REACTION

    let projectExists

    try {
      projectExists = !!(await getProject(id))
    } catch (err) {
      return await safeSendMessage(channel, `<@${user.id}>: ⚠️ Your vote was not possible to remove. (Failed to validate that message is project)`)
    }

    if (isNotSelf && isInSubmissionChannel && projectExists && isValidEmoji) {
      let member

      // Get reacting member
      try {
        member = await guild.members.fetch(user.id)
      } catch (err) {
        log.error(`Could not fetch reacting member: ${err}`)
        return await safeSendMessage(channel, `<@${user.id}>: ⚠️ Your vote was not possible to remove due to identification failure. (Discord error)`)
      }

      // Check that member existed in cache
      if (!member) {
        return await safeSendMessage(channel, `<@${user.id}>: ⚠️ Your vote was not possible to remove due to identification failure. (Member not found in guild)`)
      }

      const isUpvote = emoji.id === process.env.UPVOTE_REACTION
      const isPause = emoji.name === process.env.PAUSE_REACTION

      let result
      if (isUpvote) {
        result = await adjustUpvotesForProject('remove', id, member)
      } else if (isPause) {
        result = await suspendVotingForProject(false, id, member)
      } else {
        result = await adjustDownvotesForProject('remove', id, member)
      }

      const { success, reason, project } = result

      // Alert of errors during the vote removal process
      if (!success || !project) {
        log.error(`Could not remove ${user.id}'s vote for project ${project?.name} (${project?.id}): ${reason}`)
        return await safeSendMessage(channel, `<@${user.id}>: ⚠️ Your vote was not possible to remove. (Internal error)`)
      }

      log.info(`User ${user.id} (${user.tag}) removed their ${isUpvote ? 'upvote' : isPause ? 'suspend' : 'downvote'} for project ${project.name} (${project.id})`)
      // Since we are now pausing the submission, the rejection upon pause is possible. We will check submission here.
      const input: ShowcaseData = {
        result,
        isPause
      }

      const discordInput: ShowcaseDiscordData = {
        guild,
        channel,
        user,
        reaction
      }

      try {
        await showcase(discordInput, input)
      } catch (err) {
        log.error(`Got error during showcase rejection process: ${err}`) // Not logging more here as more detailed logs will come from downstream
        return await safeSendMessage(channel, '⚠️ Showcase rejection process failed. (Internal error)')
      }
    }
  }
}
