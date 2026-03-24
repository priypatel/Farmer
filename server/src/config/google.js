import { OAuth2Client } from 'google-auth-library';
import config from './env.js';

const client = new OAuth2Client(config.google.clientId);

export async function verifyGoogleToken(credential) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: config.google.clientId,
  });
  return ticket.getPayload();
}

export default client;
