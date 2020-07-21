import Discord from 'discord.js'

export default (client: Discord.Client, message: Discord.Message): void => {
  // Ignore all messages sent outside of the webhook channel by anything else than the webhook
  const isInSubmissionChannel = message.channel.id === process.env.PROJECT_SUBMISSIONS_CHANNEL
  const isFromWebhook = message.webhookID === process.env.GOOGLE_FORMS_WEBHOOK_ID

  if (isInSubmissionChannel && isFromWebhook) {
    // TODO: Register as project in database, store embed, add default reactions and register reaction collector
  }
}
