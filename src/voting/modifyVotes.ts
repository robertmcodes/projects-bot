import Discord from 'discord.js'
import { Project } from '../typings/interfaces'

export default (mode: 'up' | 'down', operation: 'add' | 'remove' | 'dry', voter: Discord.GuildMember, project: Project): boolean => {
  if (!process.env.STAFF_ROLE_ID || !process.env.VETERANS_ROLE_ID || !process.env.STAFF_VOTING_THRESHOLD || !process.env.VETERANS_VOTING_THRESHOLD) {
    throw new Error(`Staff and veterans role IDs (staff = ${process.env.STAFF_ROLE_ID}, veterans = ${process.env.VETERANS_ROLE_ID}) and/or associated voting thresholds (staff = ${process.env.STAFF_VOTING_THRESHOLD}, veterans = ${process.env.VETERANS_VOTING_THRESHOLD}) not set`)
  }

  const isStaff = voter.roles.cache.has(process.env.STAFF_ROLE_ID)
  const isVeteran = voter.roles.cache.has(process.env.VETERANS_ROLE_ID)
  const staffThreshold = +process.env.STAFF_VOTING_THRESHOLD
  const veteransThreshold = +process.env.VETERANS_VOTING_THRESHOLD

  const pool = mode === 'up' ? 'upvotes' : 'downvotes'
  const audience = isStaff ? 'staff' : 'veterans'
  const votePool = project[pool][audience]

  let newVoteCount
  switch (operation) {
    case 'add':
      newVoteCount = votePool + 1
      break
    case 'remove':
      newVoteCount = votePool - 1
      break
    case 'dry':
      newVoteCount = votePool
      break
    default:
      throw new Error(`hasEnoughVotes was passed an invalid operation. (${operation})`)
  }

  let hasEnoughVotes
  // Because most staff also possess the Veterans role for historical purposes, staff threshold takes priority
  if (isStaff) {
    hasEnoughVotes = newVoteCount >= staffThreshold
  } else if (isVeteran) {
    hasEnoughVotes = newVoteCount >= veteransThreshold
  } else {
    // This should never happen thanks to permissions and prior checks, but let's put it here anyways
    log.warn(`Vote registration attempted for non-staff and non-veteran user ${voter.id}`)
    hasEnoughVotes = false
  }

  return hasEnoughVotes
}
