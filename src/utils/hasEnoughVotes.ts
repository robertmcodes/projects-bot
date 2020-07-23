import Discord from 'discord.js'
import { Project } from '../typings/interfaces'

export default (type: 'up' | 'down', voter: Discord.GuildMember, project: Project): boolean => {
  // The elses of these conditionals will never fire because the app will not start without these variables being defined; this is just here to satisfy TS
  const staffRole = process.env.STAFF_ROLE_ID !== undefined ? process.env.STAFF_ROLE_ID : '257497572183113728'
  const veteransRole = process.env.VETERANS_ROLE_ID !== undefined ? process.env.VETERANS_ROLE_ID : '172018903424172032'

  const isStaff = voter.roles.cache.has(staffRole)
  const isVeteran = voter.roles.cache.has(veteransRole)

  const staffThreshold = process.env.STAFF_VOTING_THRESHOLD !== undefined ? +process.env.STAFF_VOTING_THRESHOLD : 1
  const veteransThreshold = process.env.VETERANS_VOTING_THRESHOLD !== undefined ? +process.env.VETERANS_VOTING_THRESHOLD : 3

  const newVoteCount = type === 'up' ? project.upvotes + 1 : project.upvotes - 1
  let hasEnoughVotes

  if (isStaff) {
    hasEnoughVotes = newVoteCount >= staffThreshold
  } else if (isVeteran) {
    hasEnoughVotes = newVoteCount >= veteransThreshold
  } else {
    // This should never happen thanks to permissions, but in case someone or something votes on it by accessing the channel, let's put it here anyways
    log.warn(`Vote registration attempted for non-staff and non-veteran user ${voter.id}`)
    hasEnoughVotes = false
  }

  return hasEnoughVotes
}
