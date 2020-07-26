import Discord from 'discord.js'
import safeSendMessage from '../utils/safeSendMessage'
import { adjustUpvotesForProject, adjustDownvotesForProject } from '../db'

export default async (client: Discord.Client, reaction: Discord.MessageReaction, user: Discord.User): Promise<Discord.Message | undefined> => {
  // Ensure reaction was not added in DM, even though the ID check would already technically speaking prevent this
  if (reaction.message.guild) {
    const { id, channel, guild } = reaction.message

    const isNotSelf = user.id !== client.user?.id
    const isInSubmissionChannel = channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL
    const isVoteEmoji = reaction.emoji?.id === process.env.UPVOTE_REACTION || reaction.emoji.id === process.env.DOWNVOTE_REACTION

    if (isNotSelf && isInSubmissionChannel && isVoteEmoji) {
      let member

      // Get reacting member
      try {
        member = await guild?.members.fetch(user.id)
      } catch (err) {
        log.error(`Could not fetch reacting member: ${err}`)
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to register due to identification failure. (Discord error)')
      }

      // Check that member existed in cache
      if (member === undefined) {
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to register due to identification failure. (Member not found in guild)')
      }

      // Don't need to check anything more here as checks that the other emoji is a downvote are already performed upstream
      const isUpvote = reaction.emoji.id === process.env.UPVOTE_REACTION

      // Perform actual vote operation
      const result = isUpvote
        ? await adjustUpvotesForProject('add', id, member)
        : await adjustDownvotesForProject('add', id, member)

      const { success, reason, project } = result

      // Alert of errors during the vote process
      if (!success || project === undefined) {
        log.error(`Could not register ${user.id}'s vote for project ${project?.name} (ID ${project?.id}): ${reason}`)
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to register. (Internal error)')
      }

      // Only one of these can be true per operation depending on what reaction was used
      const wasApproved = result?.wasApproved === true
      const wasRejected = result?.wasRejected === true

      // If project was approved/rejected, log such and (try to) delete submission post
      if (wasApproved || wasRejected) {
        log.info(`Project ${project.name} (ID ${project.id}) was ${wasApproved ? 'APPROVED' : 'REJECTED'} with ${project.upvotes} upvotes and ${project.downvotes} downvotes`)
        await safeSendMessage(channel, `✅ Project ${project.name} [${project.links.source}] (ID ${project.id}) was **${wasApproved ? 'APPROVED' : 'REJECTED'}** by **${user.tag}** (${user.id}) with ${project.upvotes} upvotes and ${project.downvotes} downvotes.`)

        try {
          await reaction.message.delete({ reason: `Project ${wasApproved ? 'approved' : 'rejected'} by ${user.tag} (${user.id})` })
        } catch (err) {
          log.error(`Could not delete submission post for ${project.name} (ID ${project.id}): ${err}`)
          await safeSendMessage(channel, `⚠️ Could not delete project submission post. Please delete message ${project.id} manually. (Discord error)`)
        }
      }

      log.info(`User ${user.id} (${user.tag}) ${isUpvote ? 'upvoted' : 'downvoted'} project ${project.name} (ID ${project.id})`)
    }
  }
}
