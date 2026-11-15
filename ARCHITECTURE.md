# Architecture — Pépites

Vite + React 18 + TypeScript strict + react-router-dom 6 (`HashRouter`). CSS pur avec variables. Interface 100 % en français, mobile d'abord (colonne max 480px).

## Arborescence
```
src/
  types.ts              modèle de données (NE PAS MODIFIER sans les 2 stores + SQL)
  domain/logic.ts       règles pures : balance, weekPoints, rewardStatus, missionPeriodKey, companionState…
  data/store.ts         interface DataStore
  data/localStore.ts    DataStore sur localStorage (mode 'local')
  data/supabaseStore.ts DataStore Supabase (autre agent) — createSupabaseStore(url, key)
  data/index.ts         `store` : Supabase si VITE_SUPABASE_URL + VITE_SUPABASE_KEY, sinon local (import dynamique)
  state/AppState.tsx    <AppProvider>, useApp(), useFamilyData()
  ui/                   design system (barrel : `import { Button } from '../../ui'`)
  styles/               tokens.css (variables), base.css (reset + utilitaires), ui.css (composants), app.css (shell)
  routes.tsx            agrège les routes des écrans + TABS (ne pas modifier depuis un écran)
  App.tsx               aiguillage par status + shell à onglets + verrou du mode enfant
  screens/<onglet>/     UN DOSSIER PAR ÉCRAN, chacun avec index.tsx exportant `routes: RouteObject[]`
```

## Où vit chaque écran
| Onglet | Dossier | Préfixe d'URL | Export de `index.tsx` |
|---|---|---|---|
| Bons points | `src/screens/points/` | `/` (index) | `routes` |
| Missions | `src/screens/missions/` | `/missions` | `routes` |
| Compagnons | `src/screens/companions/` | `/compagnons` | `routes` |
| Cadeaux | `src/screens/rewards/` | `/cadeaux` | `routes` |
| Coin Parent | `src/screens/parents/` | `/parents` (masqué/redirigé en mode enfant) | `routes` |
| Auth | `src/screens/auth/` | `/connexion`, `/inscription`, `/bienvenue` | `signedOutRoutes`, `noFamilyRoutes` |

Règles : un agent d'écran ne touche QUE son dossier (composants, sous-routes, CSS local `./x.css` importé par le composant, préfixe de classes propre à l'écran, ex. `.pts-…`). Sous-routes : chemins absolus sous le préfixe (`/cadeaux/:id`). Les fichiers actuels sont des PLACEHOLDERS (`screens/_shared/Placeholder.tsx` à supprimer quand plus utilisé). Besoin d'un nouveau composant partagé ? Le signaler plutôt que d'éditer `src/ui/` en parallèle.

## Statuts et shell
`App.tsx` : `loading` → splash (erreur + « Réessayer ») ; `signedOut` → `signedOutRoutes` ; `noFamily` → `noFamilyRoutes` ; `ready` → shell à onglets (`TabShell`) + `tabRoutes`, URL inconnue → `/`. Un écran sous le shell peut donc supposer `data !== null` (`useFamilyData()`).
Le shell ajoute `.has-tabbar` : `Screen` réserve alors l'espace de la barre flottante (`--tabbar-space`) et les safe-areas iOS.

## `useApp()`
```ts
status: 'loading' | 'signedOut' | 'noFamily' | 'ready'
session: Session | null
data: FamilyData | null           // events triés du plus récent au plus ancien
store: DataStore
error: string | null              // erreur du dernier chargement
busy: boolean                     // une mutation run() est en cours
refresh(): Promise<void>
run<T>(fn: (store) => Promise<T>, opts?: { success?: string; celebrate?: string | {message?, emoji?}; allowInChildMode?: boolean }): Promise<T | undefined>
   // exécute, recharge, toast d'erreur (message FR du store) ; undefined si échec ou refus en mode enfant
toast(message, { kind?: 'info'|'success'|'error', duration? })
celebrate(message? | { message?, emoji? })   // StarBurst plein écran
selectedChildIds: ID[]; selectedChildren: Child[]   // ≥ 1 enfant s'il en existe ; persisté localement
setSelectedChildIds(ids); toggleChild(id)            // toggle ne vide jamais la sélection
childMode: ID | null              // enfant en mode enfant (lecture seule) ; sélection forcée sur lui
hasPin: boolean
enterChildMode(childId): boolean  // false si aucun code parent défini
exitChildMode(pin): boolean
setPin(pin)                       // 4 chiffres, sinon throw Error
```
Rechargement automatique : `store.subscribe` (autres onglets / temps réel), `onAuthChange`, retour de visibilité de l'onglet.
Exemple : `await run((s) => s.awardPoints({...}), { celebrate: '+3 pts pour Léa !' })`.
En mode enfant : ne pas afficher d'actions d'édition ; le shell affiche un bouton cadenas en haut à droite (laisser ce coin libre) et masque le Coin Parent.

## Composants `src/ui/` (props principales)
- `Screen({ title, subtitle?, back?: boolean|string, onBack?, action?, headerExtra?, decor?=true, children })` — h1 + décor `SkyBackdrop`.
- `GlassCard({ padding?: 'none'|'sm'|'md'|'lg', strong?, as?: 'div'|'section'|'article'|'li', ...html })`
- `Button({ variant?: 'primary'|'secondary'|'danger'|'ghost', size?: 'sm'|'md'|'lg', block?, icon?: IconName|node, loading?, ...button })`
- `IconButton({ label (obligatoire), icon, variant?: 'glass'|'primary'|'plain'|'danger', size?: 'sm'|'md'|'lg' })`
- `Chip({ selected?, emoji?, children, ...button })` ; `SegmentedControl<T>({ options: {value,label,ariaLabel?}[], value, onChange, label })`
- `Avatar({ emoji, color?, size?: 'xs'|'sm'|'md'|'lg'|'xl'|number, name?, showName?, selected?, onClick?, disabled? })` — bouton si onClick (aria-pressed).
- `PointsBadge({ points, size?, signed?, tone?: 'gold'|'glass'|'negative'|'auto' })` ; `formatPoints(n, signed?)` → « 9 pts », « 1 pt », « −2 pts ».
- `ProgressBar({ value: 0..1, label, valueText?, caption?, size? })` — doré à 100 %.
- `Sheet({ open, onClose, title, description?, footer?, hideClose?, children })` — bottom sheet modale (focus piégé, Échap). `data-autofocus` pour le focus initial.
- `ConfirmDialog({ open, title, message?, confirmLabel?, cancelLabel?, danger?, busy?, onConfirm, onCancel })`
- `ToastProvider` / `useToast()` (déjà fourni par AppProvider ; préférer `useApp().toast`).
- `TextField({ label, hint?, error?, hideLabel?, trailing?, ...input })` (forwardRef)
- `NumberStepper({ value, onChange, label, min?=0, max?=999, step?=1, unit?: 'pts'|string, hideLabel? })`
- `EmojiPicker({ value, onChange, label?, sets?: ('actions'|'rewards'|'animals'|'people'|'magic')[], emojis?, allowCustom?=true })`
- `EmptyState({ emoji?, title, message?, action? })`
- `TabBar({ items: {to,label,icon,end?}[] })` (utilisé par le shell)
- `StarBurst({ message?, emoji?, onDone?, duration? })` (préférer `celebrate()`) ; respecte prefers-reduced-motion.
- `PinPad({ onComplete(pin) → boolean|void, length?=4, label? })` — renvoyer false = « Code incorrect ».
- `Icon({ name: IconName, size?=24, title? })` — noms : star, starFilled, sparkle, flag, face, gift, heart, home, plus, minus, back, chevronRight, close, pencil, trash, camera, check, lock, unlock, settings, users, history, calendar, image, logout, share, info, moon, egg, trophy.
- Utilitaires : `cx(...)`, `useModal(open, onClose)`.

## Conventions
- Couleurs/espaces/rayons : toujours `var(--…)` de `styles/tokens.css` (`--ink`, `--ink-soft`, `--raspberry`, `--violet`, `--grad-primary`, `--glass-bg`, `--r-lg`, `--s-4`, `--tap`…). Couleurs d'avatar suggérées : `--avatar-1..6` (stocker la valeur hex dans `Child.color`).
- Classes utilitaires : `.stack`, `.row`, `.row-between`, `.wrap`, `.grow`, `.muted`, `.small`, `.center`, `.section-title`, `.emoji`, `.sr-only` (`--gap` pour l'espacement).
- Cibles tactiles ≥ 48px ; champs en 16px (pas de zoom iOS) ; tout bouton-icône a un `label`.
- Logique métier : uniquement via `domain/logic.ts` ; mutations uniquement via `run()` ; erreurs du store = messages FR affichables.
- Images de récompense : redimensionner (≤ 800px) côté écran avant `store.uploadRewardImage` (data URL en mode local).
- PWA : `public/manifest.webmanifest`, `public/sw.js` (cache app shell, prod seulement), icônes `public/icons/` (`npm run icons` pour régénérer les PNG depuis `icon.svg`).

## Commandes
`npm run dev` · `npm run build` · `npm run typecheck` · `npm test` · `npm run preview` · `npm run icons`
