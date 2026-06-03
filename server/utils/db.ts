import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

let instance: Database.Database | null = null

export function getDb() {
  if (instance) return instance

  const root = process.cwd()
  const dataDir = path.join(root, 'data')
  fs.mkdirSync(dataDir, { recursive: true })

  instance = new Database(path.join(dataDir, 'spk_stunting.sqlite'))
  instance.pragma('foreign_keys = ON')

  const schemaPath = path.join(root, 'database', 'schema.sql')
  if (fs.existsSync(schemaPath)) {
    instance.exec(fs.readFileSync(schemaPath, 'utf8'))
  }

  return instance
}

export function nowSql() {
  return new Date().toISOString()
}
