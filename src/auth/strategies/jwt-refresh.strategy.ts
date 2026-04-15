import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenPayload } from '../auth.service';
import { User } from 'src/users/entities/user.entity';

function extractRefreshFromCookie(req: Request): string | null {
  return req?.cookies?.refresh_token || null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractRefreshFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TokenPayload): Promise<any> {
    const refreshToken =
      req?.cookies?.refresh_token ||
      req.get('Authorization')?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || user.status === 'inactive') {
      throw new UnauthorizedException();
    }

    return { ...payload, refreshToken };
  }
}
