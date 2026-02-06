import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { AuthenticatedUser, ZkLoginPayload } from '../types/index.js';
import { JWKS_CACHE_MAX_AGE_MS } from '../constants/index.js';

/**
 * zkLogin Service
 * Handles Google OAuth JWT verification for Sui zkLogin
 */
export class ZkLoginService {
  private jwksClient: jwksClient.JwksClient;
  private googleClientId: string;

  constructor() {
    // JWKS client to fetch Google's public keys
    this.jwksClient = jwksClient({
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
      cache: true,
      cacheMaxAge: JWKS_CACHE_MAX_AGE_MS, // 24 hours
    });

    this.googleClientId = process.env.GOOGLE_CLIENT_ID || '';

    if (!this.googleClientId) {
      console.warn('GOOGLE_CLIENT_ID not set - JWT verification will fail');
    }
  }

  /**
   * Get signing key for JWT verification
   */
  private async getSigningKey(kid: string): Promise<string> {
    const key = await this.jwksClient.getSigningKey(kid);
    return key.getPublicKey();
  }

  /**
   * Verify Google JWT token with proper signature verification
   */
  async verifyGoogleJWT(token: string): Promise<any> {
    try {
      // Decode header to get key ID
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || !decoded.header.kid) {
        throw new Error('Invalid JWT: missing key ID');
      }

      // Get public key from Google
      const signingKey = await this.getSigningKey(decoded.header.kid);

      // Verify JWT signature and claims
      const payload = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: this.googleClientId,
      });

      return payload;
    } catch (error: any) {
      console.error('JWT verification failed:', error.message);
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }

  /**
   * Generate Sui address from zkLogin payload
   * NOTE: This is simplified for hackathon - real zkLogin is more complex
   */
  async generateSuiAddress(payload: ZkLoginPayload): Promise<string> {
    // For hackathon MVP: simplified version
    // Real implementation requires zkLogin proof generation
    // For now, we'll derive a deterministic address from JWT sub

    const { jwt } = payload;
    const decoded = await this.verifyGoogleJWT(jwt);

    // Simple deterministic address generation (NOT production-ready)
    // In real zkLogin, this involves zkSNARK proofs
    const hash = await this.hashString(decoded.sub);
    return `0x${hash.slice(0, 64)}`;
  }

  /**
   * Decode JWT without verification (UNSAFE - use only for debugging)
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
   * Authenticate user with verified Google JWT
   */
  async authenticateSimplified(token: string): Promise<AuthenticatedUser> {
    try {
      // SECURE: Verify JWT signature, issuer, and audience
      const decoded = await this.verifyGoogleJWT(token);

      // Validate required fields
      if (!decoded.sub || !decoded.email) {
        throw new Error('Invalid JWT payload: missing required fields');
      }

      // Additional security checks
      if (!decoded.email_verified) {
        throw new Error('Email not verified');
      }

      // Generate deterministic Sui address from Google sub
      const hash = await this.hashString(decoded.sub);
      const address = `0x${hash.slice(0, 64)}`;

      return {
        address,
        provider: 'google',
        sub: decoded.sub,
      };
    } catch (error: any) {
      console.error('Authentication failed:', error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}

export const zkLoginService = new ZkLoginService();
