import Discord from 'discord.js'

export interface ProjectSubmission {
  id: Discord.Snowflake
  name: string
  author: Discord.Snowflake
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
  author: Discord.Snowflake
  description: string
  tech: string
  links: {
    source: string
    other: string
  }
}

export interface VoteResult {
  success: boolean
  wasApproved?: boolean
  wasRejected?: boolean
  reason: string
  project: Project | undefined
}
