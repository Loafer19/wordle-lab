// Plays one word with many strategies off the main thread (two-step entropy scans every allowed guess per turn).
import { playJobs, type Job } from './watchAll'
self.onmessage = (e: MessageEvent<{ jobs: Job[]; answers: string[]; allowed: string[]; word: string }>) => {
  const { jobs, answers, allowed, word } = e.data
  playJobs(jobs, { answers, allowed }, word, (id, n, i) => self.postMessage({ type: 'one', id, n, done: i + 1, total: jobs.length }))
  self.postMessage({ type: 'done' })
}
