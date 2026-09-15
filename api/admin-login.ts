import { createApp } from '../server/app.ts';
import { bootstrapAdmin } from '../server/bootstrap.ts';
import { assertProductionConfig } from '../server/env.ts';
import { getStorage } from '../server/storage/index.ts';

let ready: Promise<void> | null = null;
async function initialize() {
  assertProductionConfig();
  await getStorage().init();
  await bootstrapAdmin();
}
function ensureReady() {
  if (!ready) ready = initialize();
  return ready;
}
const app = createApp({ serveStatic: true });

export default async function handler(req: any, res: any) {
  await ensureReady();
  // Handle both the public login page and the login API through this
  // explicitly mapped Vercel function.
  req.url = req.method === 'POST' ? '/api/admin/login' : '/admin/login';
  return app(req, res);
}
