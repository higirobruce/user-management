import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenPayload } from '../auth.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TokenPayload): Promise<any> {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    
    if (!user || user.status === 'inactive') {
      throw new UnauthorizedException();
    }
    
    return { ...payload, refreshToken };
  }
}