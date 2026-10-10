# HustleHub+ client

The React frontend for HustleHub+. See the main README in the repository root.

```bash
npm install
copy .env.example .env      # Windows
cp .env.example .env        # macOS and Linux
npm run dev                 # https://localhost:5173
npm test                    # Vitest and React Testing Library
```

The API must run on https://localhost:5001. The dev server sends every `/api` request to it.
