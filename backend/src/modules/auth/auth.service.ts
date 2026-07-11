import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isPartyAlias, type PartyAlias } from '@canton-demo/shared/demo-money';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

import { KEYCLOAK_CONFIG } from '../../config/demo.config';

export type AuthenticatedUser = {
  actor: PartyAlias;
  token: string;
  claims: JWTPayload;
};

@Injectable()
export class AuthService {
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    this.issuer = KEYCLOAK_CONFIG.issuer;
    this.jwks = createRemoteJWKSet(new URL(KEYCLOAK_CONFIG.jwksUrl));
  }

  async authenticate(header: string | undefined): Promise<AuthenticatedUser> {
    const token = this.extractBearerToken(header);
    const { payload } = await jwtVerify(token, this.jwks, { issuer: this.issuer });
    const actor = payload.preferred_username;

    if (!isPartyAlias(actor)) {
      throw new UnauthorizedException('authenticated Keycloak user is not a demo party');
    }

    return { actor, token, claims: payload };
  }

  private extractBearerToken(header: string | undefined): string {
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing bearer token');
    }

    return header.slice('Bearer '.length);
  }
}
