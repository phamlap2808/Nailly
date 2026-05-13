import bcrypt from 'bcryptjs'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../http/errors'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  it('returns a safe admin profile for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secret-password', 10)
    const repository = {
      findActiveByEmail: vi.fn().mockResolvedValue({
        id: 'admin-1',
        email: 'owner@example.com',
        name: 'Owner',
        role: 'owner',
        passwordHash
      })
    }

    const service = new AuthService(repository)
    const result = await service.login('owner@example.com', 'secret-password')

    expect(result).toEqual({
      id: 'admin-1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner'
    })
  })

  it('rejects invalid credentials with an unauthorized error', async () => {
    const repository = { findActiveByEmail: vi.fn().mockResolvedValue(null) }
    const service = new AuthService(repository)

    await expect(service.login('missing@example.com', 'bad')).rejects.toEqual(
      new ApiError(401, 'invalid_credentials', 'Invalid email or password.')
    )
  })

  it('rejects wrong password', async () => {
    const passwordHash = await bcrypt.hash('correct', 10)
    const repository = {
      findActiveByEmail: vi.fn().mockResolvedValue({
        id: 'admin-1',
        email: 'owner@example.com',
        name: 'Owner',
        role: 'owner',
        passwordHash
      })
    }

    const service = new AuthService(repository)

    await expect(service.login('owner@example.com', 'wrong')).rejects.toEqual(
      new ApiError(401, 'invalid_credentials', 'Invalid email or password.')
    )
  })
})
