// Vercel discovers serverless functions from the repository-level api/ folder.
// Keep the implementation in src/api so it remains shared with the application.
export { default } from '../src/api/index.ts';
