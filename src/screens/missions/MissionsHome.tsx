import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useFamilyData } from '../../state/AppState';
import { Button, ConfirmDialog, EmptyState, GlassCard, ProgressBar, Screen } from '../../ui';
import type { Child, Mission } from '../../types';
import { buildSections, progressText, type MissionView, type Progress } from './grouping';
import { MissionCard } from './MissionCard';
import { MissionForm, type MissionFormValues } from './MissionForm';
import './missions.css';

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; mission: Mission };

export function MissionsHome() {
  const data = useFamilyData();
  const { run, busy, childMode } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [undo, setUndo] = useState<{ child: Child; mission: Mission; completionId: string } | null>(null);
  const [toDelete, setToDelete] = useState<Mission | null>(null);
  const [showFinished, setShowFinished] = useState(false);

  const readOnly = !!childMode;
  // En mode enfant : on ne regarde que cet enfant.
  const scopeChildren = useMemo(
    () => (childMode ? data.children.filter((c) => c.id === childMode) : data.children),
    [data.children, childMode],
  );
  const sections = useMemo(
    () => buildSections(data.missions, scopeChildren, data.completions),
    [data.missions, data.completions, scopeChildren],
  );
  const visible = sections.paused.length + sections.daily.length + sections.weekly.length + sections.challenges.length + sections.finished.length;
  const activeCount = visible - sections.paused.length;
  const me = childMode ? data.children.find((c) => c.id === childMode) : undefined;

  const validate = (mission: Mission, child: Child) =>
    void run((s) => s.completeMission(mission.id, child.id), {
      celebrate: { message: `Bravo ${child.name} ! +${mission.points} ${mission.points > 1 ? 'pts' : 'pt'}`, emoji: mission.emoji },
    });

  const confirmUndo = async () => {
    if (!undo) return;
    const { completionId, child } = undo;
    const ok = await run(async (s) => (await s.uncompleteMission(completionId), true), {
      success: `Validation annulée pour ${child.name}.`,
    });
    if (ok) setUndo(null);
  };

  const save = async (v: MissionFormValues) => {
    const editing = form.mode === 'edit' ? form.mission : null;
    // `true` en retour distingue le succès de l'échec (run renvoie undefined dans les deux cas pour un void).
    const ok = await run(async (s) => (await s.upsertMission({ ...(editing ? { id: editing.id } : {}), ...v }), true), {
      success: editing ? 'Mission mise à jour ✨' : 'Mission créée ✨',
    });
    if (ok) setForm({ mode: 'closed' });
  };

  const resume = (m: Mission) => {
    const { id, familyId: _f, createdAt: _c, ...rest } = m;
    void _f;
    void _c;
    void run((s) => s.upsertMission({ id, ...rest, active: true }), { success: `« ${m.title} » est de retour !` });
  };

  const doDelete = async () => {
    if (!toDelete) return;
    const m = toDelete;
    const ok = await run(async (s) => (await s.deleteMission(m.id), true), { success: 'Mission supprimée.' });
    setToDelete(null);
    if (ok) setForm({ mode: 'closed' });
  };

  const renderList = (views: MissionView[], opts: { paused?: boolean } = {}) => (
    <ul className="ms-list">
      {views.map((v) => (
        <MissionCard
          key={v.mission.id}
          view={v}
          readOnly={readOnly}
          paused={opts.paused}
          busy={busy}
          onValidate={(c) => validate(v.mission, c)}
          onUndo={(c, completionId) => setUndo({ child: c, mission: v.mission, completionId })}
          onEdit={() => setForm({ mode: 'edit', mission: v.mission })}
          onResume={() => resume(v.mission)}
        />
      ))}
    </ul>
  );

  const section = (id: string, title: string, views: MissionView[], hint?: string) =>
    views.length > 0 && (
      <section className="ms-section" aria-labelledby={`ms-${id}`}>
        <h2 id={`ms-${id}`} className="section-title">
          {title}
        </h2>
        {hint && <p className="muted small ms-section__hint">{hint}</p>}
        {renderList(views)}
      </section>
    );

  const noChildren = data.children.length === 0;

  let body;
  if (noChildren) {
    body = (
      <EmptyState
        emoji="🧒"
        title="Qui va relever les défis ?"
        message="Ajoute d’abord un enfant dans le Coin Parent, puis reviens créer de jolies missions."
        action={
          !readOnly && (
            <Button icon="users" onClick={() => navigate('/parents')}>
              Aller au Coin Parent
            </Button>
          )
        }
      />
    );
  } else if (activeCount === 0 && (readOnly || sections.paused.length === 0)) {
    body = readOnly ? (
      <EmptyState emoji="🌈" title="Pas de mission pour l’instant" message="Profite de ta journée ! Papa ou maman t’en préparera bientôt." />
    ) : (
      <EmptyState
        emoji="🚀"
        title="Aucune mission pour l’instant"
        message="Crée une première mission : se brosser les dents, ranger sa chambre, lire un chapitre…"
        action={
          <Button icon="plus" onClick={() => setForm({ mode: 'create' })}>
            Créer une mission
          </Button>
        }
      />
    );
  } else {
    body = (
      <>
        <ProgressSummary daily={sections.dailyProgress} weekly={sections.weeklyProgress} />
        {section('daily', 'Aujourd’hui', sections.daily)}
        {section('weekly', 'Cette semaine', sections.weekly)}
        {section('once', 'Défis', sections.challenges, 'À réussir une seule fois.')}
        {sections.finished.length > 0 && (
          <section className="ms-section" aria-labelledby="ms-finished">
            <h2 id="ms-finished" className="section-title">
              <button
                type="button"
                className="ms-fold"
                aria-expanded={showFinished}
                aria-controls="ms-finished-list"
                onClick={() => setShowFinished((x) => !x)}
              >
                <span>
                  Terminées <span className="ms-fold__count">{sections.finished.length}</span>
                </span>
                <span className="ms-fold__chev" aria-hidden="true">
                  {showFinished ? '▴' : '▾'}
                </span>
              </button>
            </h2>
            <div id="ms-finished-list" hidden={!showFinished}>
              {showFinished && renderList(sections.finished)}
            </div>
          </section>
        )}
        {!readOnly && sections.paused.length > 0 && (
          <section className="ms-section" aria-labelledby="ms-paused">
            <h2 id="ms-paused" className="section-title">
              En pause
            </h2>
            <p className="muted small ms-section__hint">Invisibles pour les enfants jusqu’à leur réactivation.</p>
            {renderList(sections.paused, { paused: true })}
          </section>
        )}
        {readOnly && <p className="ms-tip center">Montre à papa ou maman quand c’est fait ! 🌟</p>}
      </>
    );
  }

  return (
    <Screen
      title="Missions"
      subtitle={
        readOnly
          ? `${me ? `${me.name}, v` : 'V'}oici tes petits défis. Tu vas y arriver !`
          : 'Chaque petit pas compte. Valide les défis et regarde les pépites s’accumuler.'
      }
    >
      <div className="ms-root stack" style={{ ['--gap' as string]: 'var(--s-5)' }}>
        {!readOnly && !noChildren && (
          <Button block icon="plus" onClick={() => setForm({ mode: 'create' })}>
            Nouvelle mission
          </Button>
        )}
        {body}
      </div>

      {!readOnly && (
        <MissionForm
          open={form.mode !== 'closed'}
          mission={form.mode === 'edit' ? form.mission : null}
          childrenList={data.children}
          busy={busy}
          onClose={() => setForm({ mode: 'closed' })}
          onSubmit={(v) => void save(v)}
          onDelete={form.mode === 'edit' ? () => setToDelete(form.mission) : undefined}
        />
      )}

      <ConfirmDialog
        open={!!undo}
        title="Annuler cette validation ?"
        message={
          undo && (
            <>
              « {undo.mission.title} » ne sera plus validée pour {undo.child.name}, et{' '}
              {undo.mission.points > 1 ? `les ${undo.mission.points} points gagnés seront retirés` : 'le point gagné sera retiré'}.
            </>
          )
        }
        confirmLabel="Oui, annuler"
        cancelLabel="Non, garder"
        danger
        busy={busy}
        onConfirm={confirmUndo}
        onCancel={() => setUndo(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer cette mission ?"
        message={
          toDelete && (
            <>
              « {toDelete.title} » disparaîtra pour toujours, ainsi que l’historique de ses validations. Les points déjà gagnés
              restent dans le solde et le journal des enfants.
            </>
          )
        }
        confirmLabel="Supprimer"
        danger
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
      />
    </Screen>
  );
}

function ProgressSummary({ daily, weekly }: { daily: Progress; weekly: Progress }) {
  if (daily.total === 0 && weekly.total === 0) return null;
  return (
    <GlassCard padding="md" className="ms-progress" aria-label="Progression">
      {daily.total > 0 && (
        <ProgressBar
          label="Missions du jour"
          value={daily.done / daily.total}
          valueText={progressText(daily, 'aujourd’hui')}
          caption={progressText(daily, 'aujourd’hui')}
        />
      )}
      {weekly.total > 0 && (
        <ProgressBar
          size="sm"
          label="Missions de la semaine"
          value={weekly.done / weekly.total}
          valueText={progressText(weekly, 'cette semaine')}
          caption={progressText(weekly, 'cette semaine')}
        />
      )}
    </GlassCard>
  );
}
