import { describe, expect, it } from 'vitest'
import { parseDemoUser } from '../demo-user'

const validUser = {
  id: 'demo-user',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@financelens.app',
  app_metadata: {},
  user_metadata: { name: 'Demo User' },
  identities: [],
  created_at: '2026-08-24T00:00:00.000Z',
}

describe('parseDemoUser', () => {
  it('returns the parsed user for valid JSON', () => {
    expect(parseDemoUser(JSON.stringify(validUser))).toEqual(validUser)
  })

  it('returns null for null input', () => {
    expect(parseDemoUser(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDemoUser('')).toBeNull()
  })

  it('returns null for corrupted JSON', () => {
    expect(parseDemoUser('{"id": "demo-user"')).toBeNull()
  })

  it.each(['"just a string"', '123', 'true', 'null'])(
    'returns null for non-object JSON: %s',
    (input) => {
      expect(parseDemoUser(input)).toBeNull()
    }
  )

  it('returns null for JSON arrays', () => {
    expect(parseDemoUser('[1,2,3]')).toBeNull()
  })
})
