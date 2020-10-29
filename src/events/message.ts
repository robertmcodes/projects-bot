import Discord from 'discord.js'
import safeSendMessage from '../utils/safeSendMessage'
import parseGformsEmbed from '../utils/parseGformsEmbed'
import { checkForDuplicates, registerProject } from '../db'

export default async (client: Discord.Client, message: Discord.Message): Promise<Discord.Message | undefined> => {
  const { channel } = message

  // Ignore all messages sent outside of the webhook channel by anything else than the webhook
  const isInSubmissionChannel = channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL
  const isFromWebhook = message.webhookID === process.env.GOOGLE_FORMS_WEBHOOK_ID

  if (isInSubmissionChannel && isFromWebhook) {
    if (message.embeds.length === 0) {
      log.warn(`Submission ${message.id} contained no embeds, skipping`)
      await safeSendMessage(channel, '⚠️ Could not register submission, message contained no embeds.')
    } else {
      if (message.embeds.length > 1) {
        log.warn(`Detected anomalous amount of embeds in submission ${message.id}; expected 1, got ${message.embeds.length} - selecting embed at index 0`)
        await safeSendMessage(channel, '⚠️ Submission contains more than one embed. Selecting first and ignoring subsequent ones.')
      }

      let submission

      try {
        submission = parseGformsEmbed(message)
      } catch (err) {
        log.error(`Parsing of submission ${message.id} failed: ${err}`)
        return await safeSendMessage(channel, `⚠️ Could not parse submission: ${err.message} (Parser error)`)
      }

      let isDuplicate

      try {
        isDuplicate = await checkForDuplicates(submission)
      } catch (err) {
        log.error(`Duplicate checking for submission ${message.id} failed: ${err}`)
        return await safeSendMessage(channel, '⚠️ Could not check submission for duplicates, possibly incorrect amount of fields? (Database error)')
      }

      if (isDuplicate) {
        log.warn(`Duplicate detected for project ${submission.name} with source link ${submission.links.source} (Submission ${message.id})`)
        await safeSendMessage(channel, '⚠️ Submission appears to be a duplicate (one or more projects with same name and/or source link found). Review recommended.')
      }

      try {
        if (!process.env.UPVOTE_REACTION || !process.env.DOWNVOTE_REACTION || !process.env.PAUSE_REACTION) {
          throw new Error(`Upvote/downvote/pause reaction IDs not set, got upvote = ${process.env.UPVOTE_REACTION}, downvote = ${process.env.DOWNVOTE_REACTION}, pause = ${process.env.PAUSE_REACTION}`)
        }

        const upvoteReaction = process.env.UPVOTE_REACTION
        const downvoteReaction = process.env.DOWNVOTE_REACTION
        const pauseReaction = process.env.PAUSE_REACTION

        await Promise.all([
          message.react(upvoteReaction),
          message.react(downvoteReaction),
          message.react(pauseReaction)
        ])
      } catch (err) {
        log.error(`Could not add upvote and downvote reaction to submission ${message.id}: ${err}`)
        return await safeSendMessage(channel, '⚠️ Could not add upvote and downvote reactions. (Discord error)')
      }

      try {
        await registerProject(submission)
        log.info(`Project ${submission.name} (ID ${message.id}) registered for voting.`)
      } catch (err) {
        log.error(`Project registration for submission ${message.id} failed: ${err}`)
        return await safeSendMessage(channel, '⚠️ Project registration failed. (Database error)')
      }
    }
  }
}
