import { ShowcaseDiscordInput, ShowcaseInput } from '../typings/interfaces'
import Discord, { TextChannel } from 'discord.js'
import safeSendMessage from './safeSendMessage'
import createProjectEmbed from './createProjectEmbed'

export default async function (discordInput: ShowcaseDiscordInput, input: ShowcaseInput): Promise<Discord.Message | undefined> {
  const { result, isPause } = input
  const { guild, channel, user, reaction } = discordInput
  const { success, reason, project } = result

  // Alert of errors during the vote process
  if (!success || !project) {
    log.error(`Could not register ${user.id}'s vote for project ${project?.name} (ID ${project?.id}): ${reason}`)
    return await safeSendMessage(channel, '⚠️ Your vote was not possible to register. (Internal error)')
  }

  // Only one of these can be true per operation depending on what reaction was used
  const wasApproved = result?.wasApproved === true
  const wasRejected = result?.wasRejected === true
  const wasPaused = result?.wasPaused === true

  if (isPause) {
    log.info(`Voting on project ${project.name} (ID ${project.id}) was ${wasPaused ? 'suspended' : 'unsuspended'} by user ${user.id} (${user.tag})`)
  }

  // If project was approved/rejected, log such and (try to) delete submission post
  if ((wasApproved || wasRejected) && !wasPaused) {
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
  if (wasApproved && !wasPaused) {
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
