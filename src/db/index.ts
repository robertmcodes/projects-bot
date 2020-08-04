import path from 'path'
import nedb from 'nedb-promises'
import Discord from 'discord.js'
import { ProjectSubmission, Project, VoteResult } from '../typings/interfaces'
import hasEnoughVotes from '../utils/hasEnoughVotes'

let db: nedb

try {
  db = nedb.create({
    filename: path.resolve(__dirname, '../../data/projects.db'),
    autoload: true
  })
} catch (err) {
  log.error(`Database initialisation failed: ${err}`)
  log.error('Exiting...')
  process.exit(1)
}

export async function checkForDuplicates (submission: ProjectSubmission): Promise<boolean> {
  // Search for potential duplicates with same source and same name
  const haveSameName = await db.find({ name: submission.name }).exec()
  const haveSameSource = await db.find({ links: { source: submission.links.source } }).exec()

  return haveSameName.length > 0 || haveSameSource.length > 0
}

export async function registerProject (submission: ProjectSubmission): Promise<void> {
  await db.insert({
    upvotes: 0,
    downvotes: 0,
    approved: false,
    rejected: false,
    ...submission
  })
}

export async function getProject (id: Discord.Snowflake): Promise<Project | undefined> {
  const project: Project = await db.findOne({ id })
  return project
}

export async function adjustUpvotesForProject (type: 'add' | 'remove', id: Discord.Snowflake, voter: Discord.GuildMember): Promise<VoteResult> {
  const project: Project = await db.findOne({ id })

  if (!project) {
    log.error(`User ${voter} attempted to ${type === 'add' ? 'upvote' : 'remove upvote for'} non-existent project (ID ${id})`)
    return { success: false, wasApproved: false, reason: 'Project not found', project }
  } else {
    const hasEnoughUpvotes = hasEnoughVotes('up', type, voter, project)

    const toUpdate = {
      ...project,
      upvotes: type === 'add' ? ++project.upvotes : --project.upvotes,
      approved: hasEnoughUpvotes
    }

    try {
      await db.update({ id }, toUpdate)
    } catch (err) {
      return { success: false, wasApproved: false, reason: err.message, project }
    }

    return { success: true, wasApproved: hasEnoughUpvotes, reason: '', project }
  }
}

export async function adjustDownvotesForProject (type: 'add' | 'remove', id: Discord.Snowflake, voter: Discord.GuildMember): Promise<VoteResult> {
  const project: Project = await db.findOne({ id })

  if (!project) {
    log.error(`User ${voter} attempted to ${type === 'add' ? 'downvote' : 'remove downvote for'} non-existent project (ID ${id})`)
    return { success: false, wasRejected: false, reason: 'Project not found', project }
  } else {
    const hasEnoughDownvotes = hasEnoughVotes('down', type, voter, project)

    const toUpdate = {
      ...project,
      downvotes: type === 'add' ? ++project.downvotes : --project.downvotes,
      rejected: hasEnoughDownvotes
    }

    try {
      await db.update({ id }, toUpdate)
    } catch (err) {
      return { success: false, wasRejected: false, reason: err.message, project }
    }

    return { success: true, wasRejected: hasEnoughDownvotes, reason: '', project }
  }
}
