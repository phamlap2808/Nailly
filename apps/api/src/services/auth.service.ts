import bcrypt from 'bcryptjs'
import { ApiError } from '../http/errors'

export class AuthService {
  constructor(
    private readonly repository: {
      findActiveByEmail(email: string): Promise<{
        id: string
        email: string
        name: string
        role: string
        passwordHash: string
      } | null>
    }
  ) {}

  async login(email: string, password: string) {
    const user = await this.repository.findActiveByEmail(email)

    if (!user) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid email or password.')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid email or password.')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  }
}
