# Pépites ✨

Webapp familiale (PWA) : les parents attribuent des bons points aux enfants pour leurs bonnes actions ; les points débloquent des récompenses.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run build      # typecheck + build statique dans dist/
```

Sans configuration, l'app fonctionne en **mode local** (données dans le navigateur). Pour synchroniser entre appareils, copier `.env.example` en `.env.local` et renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_KEY`.

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour l'organisation du code.
