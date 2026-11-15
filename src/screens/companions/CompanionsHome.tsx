// Onglet « Compagnons » : le compagnon de chaque enfant, qui grandit avec les points gagnés depuis toujours.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useFamilyData } from '../../state/AppState';
import { COMPANION_STAGES, companionState } from '../../domain/logic';
import { Avatar, Button, GlassCard, Icon, IconButton, ProgressBar, Screen, Sheet, TextField, formatPoints } from '../../ui';
import type { Child } from '../../types';
import { CompanionArt, sparklePath } from './CompanionArt';
import { EvolutionReveal } from './EvolutionReveal';
import { companionHues } from './palette';
import { readSeenStage, seenDecision, writeSeenStage } from './seen';
import './companions.css';

const NAME_MAX = 24;

export function displayCompanionName(child: Pick<Child, 'companionName'>): string {
  return child.companionName.trim() || 'Petit compagnon';
}

export function CompanionsHome() {
  const data = useFamilyData();
  const { childMode, selectedChildren } = useApp();
  const navigate = useNavigate();
  const children = data.children;
  const hues = useMemo(() => companionHues(children), [children]);

  const [shownId, setShownId] = useState<string | null>(() => childMode ?? selectedChildren[0]?.id ?? null);
  const child =
    children.find((c) => c.id === (childMode ?? shownId)) ?? selectedChildren[0] ?? children[0] ?? null;

  if (!child) {
    return (
      <Screen title="Compagnons">
        <GlassCard padding="lg" className="cmp-empty">
          <CompanionArt stage={0} hue={300} size={150} decorative />
          <h2 className="cmp-empty__title">Aucun compagnon pour l’instant</h2>
          <p className="muted">
            Chaque enfant reçoit un œuf magique qui éclot et grandit avec ses points. Ajoutez un enfant dans le Coin
            Parent pour faire apparaître le premier.
          </p>
          {!childMode && (
            <Button icon="plus" onClick={() => navigate('/parents')}>
              Ajouter un enfant
            </Button>
          )}
        </GlassCard>
      </Screen>
    );
  }

  const showPicker = !childMode && children.length > 1;

  return (
    <Screen
      title="Compagnons"
      subtitle={childMode ? 'Ton compagnon grandit avec tes points' : 'Ils grandissent avec chaque point gagné'}
      headerExtra={
        showPicker ? (
          <div className="cmp-picker" role="group" aria-label="Choisir l’enfant">
            {children.map((c) => (
              <Avatar
                key={c.id}
                emoji={c.emoji}
                color={c.color}
                name={c.name}
                showName
                size="sm"
                selected={c.id === child.id}
                onClick={() => setShownId(c.id)}
              />
            ))}
          </div>
        ) : undefined
      }
    >
      <CompanionView key={child.id} child={child} hue={hues.get(child.id) ?? 270} canEdit={!childMode} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------

interface ViewProps {
  child: Child;
  hue: number;
  canEdit: boolean;
}

function CompanionView({ child, hue, canEdit }: ViewProps) {
  const data = useFamilyData();
  const state = useMemo(() => companionState(data.events, child.id), [data.events, child.id]);
  const name = displayCompanionName(child);
  const [renaming, setRenaming] = useState(false);
  const [reveal, setReveal] = useState<{ from: number; to: number } | null>(null);

  // Moment d'évolution : compare avec le dernier stade vu sur cet appareil.
  useEffect(() => {
    const d = seenDecision(readSeenStage(child.id), state.stage);
    if (d.kind === 'record') writeSeenStage(child.id, state.stage);
    else if (d.kind === 'evolve') setReveal({ from: d.from, to: state.stage });
  }, [child.id, state.stage]);

  const closeReveal = () => {
    if (reveal) writeSeenStage(child.id, reveal.to);
    setReveal(null);
  };

  const next = state.nextAt != null ? COMPANION_STAGES[state.stage + 1] : null;
  const missing = state.nextAt != null ? state.nextAt - state.lifetime : 0;

  return (
    <div className="stack cmp-view" style={{ '--gap': 'var(--s-4)' } as CSSProperties}>
      <GlassCard padding="lg" className="cmp-hero" as="section" aria-labelledby="cmp-name">
        <PokeableArt stage={state.stage} hue={hue} name={name} />
        <div className="cmp-hero__names">
          <div className="cmp-hero__name-row">
            <h2 id="cmp-name" className="cmp-hero__name">
              {name}
            </h2>
            {canEdit && (
              <IconButton label={`Renommer ${name}`} icon="pencil" size="sm" onClick={() => setRenaming(true)} />
            )}
          </div>
          <p className="cmp-hero__owner">Compagnon de {child.name}</p>
          <p className="cmp-hero__stage">
            <Icon name="sparkle" size={16} />
            <span>
              Stade {state.stage + 1}/{COMPANION_STAGES.length} · <strong>{state.label}</strong>
            </span>
          </p>
        </div>
      </GlassCard>

      <GlassCard padding="md" as="section" className="cmp-grow" aria-label="Croissance">
        {next ? (
          <ProgressBar
            value={state.progress}
            label={`Progression vers le stade ${next.label}`}
            valueText={`Encore ${formatPoints(missing)} avant le stade ${next.label}`}
            caption={
              <span className="cmp-grow__caption">
                Encore <strong>{formatPoints(missing)}</strong> avant : <strong>{next.label}</strong>
              </span>
            }
            size="lg"
          />
        ) : (
          <ProgressBar
            value={1}
            label="Croissance terminée"
            valueText={`${name} a atteint le stade légendaire`}
            caption={<span className="cmp-grow__caption">{name} est au sommet de sa magie ✨</span>}
            size="lg"
          />
        )}
        <div className="cmp-grow__total">
          <span className="cmp-grow__total-value">{state.lifetime}</span>
          <span className="cmp-grow__total-label">
            {state.lifetime === 1 ? 'point gagné' : 'points gagnés'} depuis toujours
            <span className="cmp-grow__hint">Les cadeaux échangés ne le font jamais rapetisser.</span>
          </span>
        </div>
      </GlassCard>

      <GlassCard padding="md" as="section" aria-labelledby="cmp-journey-title">
        <h2 id="cmp-journey-title" className="section-title">
          Son voyage
        </h2>
        <ol className="cmp-journey">
          {COMPANION_STAGES.map((s) => {
            const status = s.stage < state.stage ? 'done' : s.stage === state.stage ? 'current' : 'todo';
            const a11y =
              status === 'todo'
                ? `Stade mystère, à ${formatPoints(s.at)}`
                : `${s.label}, ${status === 'current' ? 'stade actuel' : 'atteint'}`;
            return (
              <li key={s.stage} className={`cmp-journey__step is-${status}`} aria-label={a11y}>
                <span className="cmp-journey__disc" aria-hidden="true">
                  <CompanionArt stage={s.stage} hue={hue} size={44} animated={false} decorative silhouette={status === 'todo'} />
                  {status === 'todo' && <span className="cmp-journey__q">?</span>}
                  {status === 'done' && (
                    <span className="cmp-journey__check">
                      <Icon name="check" size={12} strokeWidth={3.5} />
                    </span>
                  )}
                </span>
                <span className="cmp-journey__at" aria-hidden="true">
                  {s.at === 0 ? 'Départ' : `${s.at} pts`}
                </span>
              </li>
            );
          })}
        </ol>
      </GlassCard>

      {canEdit && <RenameSheet open={renaming} child={child} onClose={() => setRenaming(false)} />}
      {reveal && (
        <EvolutionReveal from={reveal.from} to={reveal.to} hue={hue} companionName={name} onDone={closeReveal} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const PARTICLES = [
  { x: -70, y: -60, r: -18, d: 0 },
  { x: 64, y: -74, r: 14, d: 0.05 },
  { x: -96, y: -6, r: -8, d: 0.1 },
  { x: 92, y: -18, r: 20, d: 0.08 },
  { x: -30, y: -100, r: 6, d: 0.14 },
  { x: 34, y: -108, r: -12, d: 0.18 },
];

function PokeableArt({ stage, hue, name }: { stage: number; hue: number; name: string }) {
  const [poke, setPoke] = useState(0);
  const timer = useRef<number>();
  const isEgg = stage <= 1;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onPoke = () => {
    setPoke((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPoke(0), 1300);
  };

  const reaction = isEgg
    ? 'L’œuf remue doucement…'
    : stage === 2
      ? `${name} glousse dans sa coquille !`
      : `${name} est tout content !`;

  return (
    <div className="cmp-hero__art-wrap">
      <button
        type="button"
        className="cmp-hero__art"
        onClick={onPoke}
        aria-label={isEgg ? `Caresser l’œuf de ${name}` : `Faire un câlin à ${name}`}
      >
        <span key={poke} className={poke ? 'cmp-poke is-active' : 'cmp-poke'}>
          <CompanionArt stage={stage} hue={hue} size={240} decorative />
        </span>
      </button>
      {poke > 0 && (
        <span key={`p${poke}`} className="cmp-particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="cmp-particle"
              style={{ '--dx': `${p.x}px`, '--dy': `${p.y}px`, '--rot': `${p.r}deg`, animationDelay: `${p.d}s` } as CSSProperties}
            >
              {isEgg || i % 2 ? (
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path d={sparklePath(12, 12, 11)} fill="#ffd84d" stroke="#d99a00" strokeWidth={1} />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    d="M12 21s-7.5-4.6-9.3-9.2C1.5 8.6 3.6 5 7 5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.5 3.6 4.3 6.8C19.5 16.4 12 21 12 21z"
                    fill="#ff8fb3"
                    stroke="#d6336c"
                    strokeWidth={1.4}
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          ))}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {poke > 0 ? reaction : ''}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------

function RenameSheet({ open, child, onClose }: { open: boolean; child: Child; onClose: () => void }) {
  const { run } = useApp();
  const [value, setValue] = useState(child.companionName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(child.companionName);
      setError(null);
    }
  }, [open, child.companionName]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const companionName = value.trim().replace(/\s+/g, ' ');
    if (!companionName) {
      setError('Donnez-lui un petit nom.');
      return;
    }
    if (companionName === child.companionName) {
      onClose();
      return;
    }
    setSaving(true);
    const ok = await run(
      (s) =>
        s
          .upsertChild({
            id: child.id,
            name: child.name,
            emoji: child.emoji,
            color: child.color,
            birthdate: child.birthdate,
            companionName,
          })
          .then(() => true),
      { success: `Le compagnon s’appelle maintenant ${companionName} !` },
    );
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Renommer le compagnon"
      description={`Le compagnon de ${child.name}.`}
      footer={
        <div className="row" style={{ '--gap': 'var(--s-3)' } as CSSProperties}>
          <Button variant="secondary" onClick={onClose} className="grow">
            Annuler
          </Button>
          <Button type="submit" form="cmp-rename-form" loading={saving} className="grow">
            Enregistrer
          </Button>
        </div>
      }
    >
      <form id="cmp-rename-form" onSubmit={submit} noValidate>
        <TextField
          label="Nom du compagnon"
          value={value}
          maxLength={NAME_MAX}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          hint={`${NAME_MAX} caractères maximum`}
          autoComplete="off"
          enterKeyHint="done"
          data-autofocus
        />
      </form>
    </Sheet>
  );
}
