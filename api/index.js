import app, { ensureDbReady } from '../server/server.js';

export default async function handler(req, res) {
  await ensureDbReady();
  return app(req, res);
}
