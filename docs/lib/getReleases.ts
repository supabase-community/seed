import path from "path"
import fs from "fs/promises"

export async function getReleases() {
  const releasesDirectory = path.join(process.cwd(), 'releases')
  const files = await fs.readdir(releasesDirectory)

  const releases = files.map(async (file) => {
    const filePath = path.join(releasesDirectory, file)
    const filePathParsed = path.parse(filePath)
    return {
      filename: filePathParsed.base
    }
  })

  return (await Promise.all(releases)).sort(((a, b) => a.filename.localeCompare(b.filename))).reverse()
}