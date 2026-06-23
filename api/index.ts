import { createApp } from "../server/index";

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    process.env.VERCEL = "1";
    const app = await createApp();
    cachedApp = app;
  }
  return cachedApp(req, res);
}
