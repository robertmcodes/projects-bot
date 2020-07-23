import Discord from 'discord.js'

export interface ProjectSubmission {
  id: Discord.Snowflake
  name: string
  author: string
  description: string
  tech: string
  links: {
    source: string
    other: string
  }
}

export interface Project {
  upvotes: number
  downvotes: number
  approved: boolean
  rejected: boolean
  id: Discord.Snowflake
  name: string
  author: string
  description: string
  tech: string
  links: {
    source: string
    other: string
  }
}

export interface UpvoteResult {
  success: boolean
  wasApproved: boolean
  reason: string
  project: Project
}

export interface DownvoteResult {
  success: boolean
  wasRejected: boolean
  reason: string
  project: Project
}
