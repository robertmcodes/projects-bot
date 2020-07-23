import path from 'path'
import nedb from 'nedb-promises'
import Discord from 'discord.js'
import { ProjectSubmission, Project, UpvoteResult, DownvoteResult } from '../typings/interfaces'
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

export async function upvoteProject (id: Discord.Snowflake, upvoter: Discord.GuildMember): Promise<UpvoteResult> {
  const project: Project = await db.findOne({ id })

  if (project === undefined) {
    log.error(`User ${upvoter} attempted to upvote non-existent project with ID ${id}`)
    return { success: false, wasApproved: false, reason: 'Project not found', project }
  } else {
    const hasEnoughUpvotes = hasEnoughVotes('up', upvoter, project)

    const toUpdate = {
      ...project,
      upvotes: ++project.upvotes,
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

export async function downvoteProject (id: Discord.Snowflake, downvoter: Discord.GuildMember): Promise<DownvoteResult> {
  const project: Project = await db.findOne({ id })

  if (project === undefined) {
    log.error(`User ${downvoter} attempted to downvote non-existent project with ID ${id}`)
    return { success: false, wasRejected: false, reason: 'Project not found', project }
  } else {
    const hasEnoughDownvotes = hasEnoughVotes('down', downvoter, project)

    const toUpdate = {
      ...project,
      upvotes: --project.downvotes,
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
