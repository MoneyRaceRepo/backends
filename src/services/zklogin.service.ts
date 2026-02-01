import type { AuthenticatedUser, ZkLoginPayload } from '../types/index.js';

/**
 * zkLogin Service
 * Handles Google OAuth JWT verification for Sui zkLogin
 */
export class ZkLoginService {
  // /**
  //  * Verify Google JWT token (for future implementation)
  //  */
  // async verifyGoogleJWT(jwt: string): Promise<any> {
  //   // For MVP: Use simplified auth instead
  //   // Production would use proper JWKS verification
  //   throw new Error('Use authenticateSimplified() for MVP');
  // }

  /**
   * Generate Sui address from zkLogin payload
   * NOTE: This is simplified for hackathon - real zkLogin is more complex
   */
  async generateSuiAddress(payload: ZkLoginPayload): Promise<string> {
    // For hackathon MVP: simplified version
    // Real implementation requires zkLogin proof generation
    // For now, we'll derive a deterministic address from JWT sub

    const { jwt } = payload;
    const decoded = this.decodeJWT(jwt);

    // Simple deterministic address generation (NOT production-ready)
    // In real zkLogin, this involves zkSNARK proofs
    const hash = await this.hashString(decoded.sub);
    return `0x${hash.slice(0, 64)}`;
  }

  /**
   * Decode JWT without verification (for hackathon)
   */
  private decodeJWT(jwt: string): any {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payloadPart = parts[1];
    if (!payloadPart) {
      throw new Error('Invalid JWT: missing payload');
    }

    // Decode base64url
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

    return payload;
  }

  /**
   * Simple hash function for deterministic address
   */
  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Simplified auth for hackathon (bypasses full zkLogin complexity)
   */
  async authenticateSimplified(jwt: string): Promise<AuthenticatedUser> {
    try {
      const decoded = this.decodeJWT(jwt);

      // Basic validation
      if (!decoded.sub || !decoded.email) {
        throw new Error('Invalid JWT payload');
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        throw new Error('JWT expired');
      }

      // Generate Sui address (simplified)
      const hash = await this.hashString(decoded.sub);
      const address = `0x${hash.slice(0, 64)}`;

      return {
        address,
        provider: 'google',
        sub: decoded.sub,
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Authentication failed');
    }
  }
}

export const zkLoginService = new ZkLoginService();
