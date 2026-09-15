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
  // GET /admin is rewritten here for the server-side page guard. Vercel also
  // dispatches the nested login POST through this function, so preserve the
  // API pathname for Express to reach its existing POST handler.
  req.url = req.method === 'POST'
    ? '/api/admin/login'
    : req.method === 'PUT'
      ? '/api/admin/content'
      : '/admin';
  return app(req, res);
}
