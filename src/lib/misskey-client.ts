/**
 * Singleton Misskey client instance
 */

import { MisskeyService, BotSystem } from './misskey';

let misskeyService: MisskeyService | null = null;
let botSystem: BotSystem | null = null;

export function getMisskeyService(): MisskeyService {
  if (!misskeyService) {
    const apiUrl = process.env.MISSKEY_API_URL || 'http://localhost:3001';
    const adminToken = process.env.MISSKEY_ADMIN_TOKEN;

    if (!adminToken) {
      throw new Error('MISSKEY_ADMIN_TOKEN environment variable is required');
    }

    misskeyService = new MisskeyService({
      apiUrl,
      adminToken,
    });
  }

  return misskeyService;
}

export async function getBotSystem(): Promise<BotSystem> {
  if (!botSystem) {
    const service = getMisskeyService();
    botSystem = new BotSystem(service);
    await botSystem.initialize();
  }

  return botSystem;
}

// Initialize on module load in development
if (process.env.NODE_ENV === 'development') {
  getMisskeyService();
}