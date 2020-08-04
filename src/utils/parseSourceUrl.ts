import { URL } from 'url'

export default (url: string): string => {
  try {
    return `[View on ${new URL(url).hostname}](${url})`
  } catch (err) {
    log.warn(`Could not parse URL from source ${url}: ${err}`)
    return url
  }
}
