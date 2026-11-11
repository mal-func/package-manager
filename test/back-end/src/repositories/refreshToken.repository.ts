import { prisma } from "../lib/prisma.js";

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string;
  userAgent?: string;
}

/**
 * All direct Prisma access for the RefreshToken model, including the
 * rotation-chain bookkeeping (replacedByTokenId) used to detect reuse
 * of an already-rotated token.
 */
export const refreshTokenRepository = {
  create(input: CreateRefreshTokenInput) {
    return prisma.refreshToken.create({ data: input });
  },

  findByTokenHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  /**
   * Marks `tokenId` as revoked and links it to the token that replaced it.
   */
  markRotated(tokenId: string, replacedByTokenId: string) {
    return prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date(), replacedByTokenId },
    });
  },

  revoke(tokenId: string) {
    return prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  },

  /**
   * Revokes every active token for a user — used when reuse of an
   * already-rotated token is detected (signals the token chain may be
   * compromised) and for "log out everywhere."
   */
  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
