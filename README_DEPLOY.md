# Aviator Predictor - Vercel deployment fix

IMPORTANT: this package contains the Node/Vercel TypeScript fixes. Replace the repository contents with these files; do not leave the older API files in GitHub.

The Vercel Function validator requires explicit `.js` extensions for relative imports when Node16/NodeNext resolution is used. All `/api/*.ts` imports of `src/lib/server` use `../src/lib/server.js` in this package.

`payment-create.ts` declares `amount` and `currency` before they are used.

Vercel settings:
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

After pushing, verify the Vercel clone log shows a NEW commit hash. If it still shows commit `607f99f`, the fixed files were not pushed to GitHub.
