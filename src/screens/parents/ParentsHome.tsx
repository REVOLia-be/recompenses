import { useApp } from '../../state/AppState';
import { GlassCard, Screen } from '../../ui';
import { ChildModeSection } from './ChildModeSection';
import { ChildrenSection } from './ChildrenSection';
import { ParentsSection } from './ParentsSection';
import { SettingsSection } from './SettingsSection';
import { joinNames } from './validation';
import './parents.css';

/** Accueil du Coin Parent. */
export function ParentsHome() {
  const { data } = useApp();
  if (!data) return null;
  const others = data.parents.filter((p) => p.id !== data.me.id).map((p) => p.name);
  const names = joinNames([data.me.name, ...others]);

  return (
    <Screen title="Coin Parent" subtitle="Tout pour organiser la famille, en douceur">
      <GlassCard strong>
        <p className="par-welcome">
          Bienvenue {names} <span className="emoji">💛</span>
        </p>
        <p className="small muted">Famille {data.family.name}</p>
      </GlassCard>
      <ChildrenSection data={data} />
      <ParentsSection data={data} />
      <ChildModeSection />
      <SettingsSection />
    </Screen>
  );
}
