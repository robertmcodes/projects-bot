import Discord, { TextChannel } from 'discord.js'
import safeSendMessage from '../utils/safeSendMessage'
import { adjustUpvotesForProject, adjustDownvotesForProject } from '../db'
import createProjectEmbed from '../utils/createProjectEmbed'

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
      if (!member) {
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
      if (!success || !project) {
        log.error(`Could not register ${user.id}'s vote for project ${project?.name} (ID ${project?.id}): ${reason}`)
        return await safeSendMessage(channel, '⚠️ Your vote was not possible to register. (Internal error)')
      }

      log.info(`User ${user.id} (${user.tag}) ${isUpvote ? 'upvoted' : 'downvoted'} project ${project.name} (ID ${project.id})`)

      // Only one of these can be true per operation depending on what reaction was used
      const wasApproved = result?.wasApproved === true
      const wasRejected = result?.wasRejected === true

      // If project was approved/rejected, log such and (try to) delete submission post
      if (wasApproved || wasRejected) {
        const staffVotes = { up: project.upvotes.staff, down: project.downvotes.staff }
        const veteranVotes = { up: project.upvotes.veterans, down: project.downvotes.veterans }

        log.info(`Project ${project.name} (ID ${project.id}) was ${wasApproved ? 'approved' : 'rejected'} with ${staffVotes.up + veteranVotes.up} upvotes [Staff/vet spread: ${staffVotes.up} | ${veteranVotes.up}] and ${staffVotes.down + veteranVotes.down} downvotes [Staff/vet spread: ${staffVotes.down} | ${veteranVotes.down}]`)

        const voteSituation = `**Upvotes:** **${project.upvotes.staff}** staff, **${project.upvotes.veterans}** veterans\n**Downvotes:** **${project.downvotes.staff}** staff, **${project.downvotes.veterans}** veterans`
        await safeSendMessage(channel, `${wasApproved ? '✅' : '❌'} Project **${project.name}** (${project.links.source}, ID ${project.id}) was **${wasApproved ? 'APPROVED' : 'REJECTED'}** by **${user.tag}** (${user.id}) with following vote situation:\n${voteSituation}`)

        try {
          await reaction.message.delete({ reason: `Project ${wasApproved ? 'approved' : 'rejected'} by ${user.tag} (${user.id})` })
        } catch (err) {
          log.error(`Could not delete submission post for ${project.name} (ID ${project.id}): ${err}`)
          await safeSendMessage(channel, `⚠️ Could not delete project submission post. Please delete message ${project.id} manually. (Discord error)`)
        }
      }

      // Post to public showcase
      if (wasApproved) {
        try {
          if (!process.env.PROJECT_SHOWCASE_CHANNEL) {
            throw new Error(`Project showcase channel ID not set, got ${process.env.PROJECT_SHOWCASE_CHANNEL}`)
          }

          // Having to type cast here and just separately check that this channel has a send method
          // FWIW, this seems to indeed be the official recommended method by the discord.js development team: https://github.com/discordjs/discord.js/issues/3622#issuecomment-565566337
          const showcaseChannel = guild.channels.cache.get(process.env.PROJECT_SHOWCASE_CHANNEL) as TextChannel

          if (!showcaseChannel || !showcaseChannel.send) {
            throw new Error('Project showcase channel not found in cache or is not a text channel, possible configuration error')
          }

          const embed = createProjectEmbed(project, guild)
          await showcaseChannel.send(null, embed)
          log.info(`Project ${project.name} (ID ${project.id}) posted to showcase channel.`)
        } catch (err) {
          log.error(`Could not post project ${project.name} (ID ${project.id}) to showcase channel: ${err}`)
          await safeSendMessage(channel, '⚠️ Could not post project to showcase channel. (Internal error)')
        }
      }
    }
  }
}
