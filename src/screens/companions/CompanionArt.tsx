// Illustration vectorielle du compagnon (petit esprit-nuage étoilé, « Pépiton »),
// pour les 6 stades de COMPANION_STAGES. Réutilisable ailleurs (vignettes) :
//   import { CompanionArt } from '../companions/CompanionArt';
import { useId, type CSSProperties, type ReactNode } from 'react';
import { COMPANION_STAGES } from '../../domain/logic';
import { companionPalette, type CompanionPalette } from './palette';
import './companions.css';

export interface CompanionArtProps {
  /** Stade 0..5 (voir COMPANION_STAGES). */
  stage: number;
  /** Teinte 0..360 (voir companionHues / baseCompanionHue). Défaut : lilas. */
  hue?: number;
  /** Taille en px (carré). Défaut 200. */
  size?: number;
  /** Animations douces (respiration, clignement…). Défaut true. Coupées sous prefers-reduced-motion. */
  animated?: boolean;
  /** Libellé accessible. Défaut : « Compagnon — {stade} ». */
  label?: string;
  /** Purement décoratif (aria-hidden). */
  decorative?: boolean;
  /** Silhouette mystère (stade pas encore atteint). */
  silhouette?: boolean;
  className?: string;
  style?: CSSProperties;
}

const INK = '#2a2150';
const GOLD = '#ffd84d';
const GOLD_EDGE = '#d99a00';
const LEAF = '#b4e6bf';
const LEAF_EDGE = '#5fae79';
const NEST = '#f3c9a0';
const NEST_BACK = '#dca77c';
const NEST_EDGE = '#b07a52';

export function stageLabel(stage: number): string {
  return COMPANION_STAGES[clampStage(stage)].label;
}

function clampStage(stage: number): number {
  return Math.max(0, Math.min(COMPANION_STAGES.length - 1, Math.round(stage) || 0));
}

// ---------------------------------------------------------------------------
// Géométrie
// ---------------------------------------------------------------------------
function starPath(cx: number, cy: number, R: number, ratio = 0.5, n = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? R : R * ratio;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/** Étincelle à 4 branches incurvées. */
export function sparklePath(cx: number, cy: number, R: number): string {
  const k = R * 0.18;
  return (
    `M${cx} ${cy - R} Q${cx + k} ${cy - k} ${cx + R} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + R} ` +
    `Q${cx - k} ${cy + k} ${cx - R} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - R} Z`
  );
}

function Star({ x, y, r, className, style }: { x: number; y: number; r: number; className?: string; style?: CSSProperties }) {
  return (
    <path
      d={starPath(x, y, r, 0.52)}
      fill={GOLD}
      stroke={GOLD_EDGE}
      strokeWidth={Math.max(1.4, r * 0.22)}
      strokeLinejoin="round"
      className={className}
      style={style}
    />
  );
}

function Sparkle({ x, y, r, delay = 0, color = '#fff' }: { x: number; y: number; r: number; delay?: number; color?: string }) {
  return (
    <path
      d={sparklePath(x, y, r)}
      fill={color}
      stroke={GOLD_EDGE}
      strokeOpacity={0.35}
      strokeWidth={1}
      className="cmp-a-twinkle"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function Leaf({ x, y, angle, len = 30, w = 9 }: { x: number; y: number; angle: number; len?: number; w?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        d={`M0 0 C${len * 0.3} ${-w} ${len * 0.72} ${-w} ${len} 0 C${len * 0.72} ${w} ${len * 0.3} ${w} 0 0 Z`}
        fill={LEAF}
        stroke={LEAF_EDGE}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d={`M${len * 0.12} 0 Q${len * 0.5} ${-w * 0.15} ${len * 0.8} 0`} stroke={LEAF_EDGE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Pièces communes
// ---------------------------------------------------------------------------
function Shadow({ rx = 52 }: { rx?: number }) {
  return <ellipse cx={100} cy={185} rx={rx} ry={7} fill={INK} opacity={0.1} />;
}

function NestBack() {
  return (
    <g>
      <Leaf x={66} y={160} angle={-150} len={34} w={10} />
      <Leaf x={134} y={160} angle={-30} len={34} w={10} />
      <ellipse cx={100} cy={160} rx={60} ry={13} fill={NEST_BACK} stroke={NEST_EDGE} strokeWidth={2} />
    </g>
  );
}

function NestFront() {
  return (
    <g>
      <path
        d="M38 158 C42 188 158 188 162 158 C140 172 60 172 38 158 Z"
        fill={NEST}
        stroke={NEST_EDGE}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <g stroke={NEST_EDGE} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.7}>
        <path d="M52 170 Q78 178 100 176" />
        <path d="M104 178 Q130 178 150 168" />
        <path d="M64 177 Q90 184 118 181" />
      </g>
      <Leaf x={46} y={162} angle={168} len={26} w={8} />
      <Leaf x={154} y={162} angle={12} len={26} w={8} />
      <Leaf x={88} y={180} angle={150} len={18} w={6} />
      <Leaf x={114} y={180} angle={30} len={18} w={6} />
    </g>
  );
}

const EGG = 'M100 60 C128 60 142 98 142 124 C142 152 124 168 100 168 C76 168 58 152 58 124 C58 98 72 60 100 60 Z';
const EGG_BOTTOM =
  'M58 124 L67 115 L77 126 L88 114 L100 126 L112 114 L123 126 L133 115 L142 124 C142 152 124 168 100 168 C76 168 58 152 58 124 Z';
const EGG_CAP = 'M70 80 C72 56 128 56 130 80 L121 73 L112 82 L103 72 L94 82 L85 72 L77 82 Z';

function EggDecor({ p }: { p: CompanionPalette }) {
  return (
    <g>
      <path d={starPath(117, 98, 8, 0.5)} fill={p.spot} stroke={p.deep} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={starPath(82, 134, 6, 0.5)} fill={p.spot} stroke={p.deep} strokeWidth={1.3} strokeLinejoin="round" />
      <path d={starPath(112, 150, 4.5, 0.5)} fill={p.spot} stroke={p.deep} strokeWidth={1.2} strokeLinejoin="round" />
      <circle cx={120} cy={128} r={3.5} fill={p.spot} />
      <circle cx={92} cy={108} r={2.6} fill={p.spot} />
      <circle cx={74} cy={112} r={2.2} fill={p.spot} />
    </g>
  );
}

function Eyes({ lx, rx, y, ew, eh }: { lx: number; rx: number; y: number; ew: number; eh: number }) {
  const eye = (x: number) => (
    <g key={x}>
      <ellipse cx={x} cy={y} rx={ew} ry={eh} fill={INK} />
      <circle cx={x - ew * 0.3} cy={y - eh * 0.38} r={ew * 0.42} fill="#fff" />
      <circle cx={x + ew * 0.38} cy={y + eh * 0.36} r={ew * 0.2} fill="#fff" />
    </g>
  );
  return <g className="cmp-a-blink">{[eye(lx), eye(rx)]}</g>;
}

function Cheeks({ lx, rx, y, p, w = 8, h = 5 }: { lx: number; rx: number; y: number; p: CompanionPalette; w?: number; h?: number }) {
  return (
    <g fill={p.cheek} opacity={0.75}>
      <ellipse cx={lx} cy={y} rx={w} ry={h} />
      <ellipse cx={rx} cy={y} rx={w} ry={h} />
    </g>
  );
}

function Gradients({ id, p }: { id: string; p: CompanionPalette }) {
  return (
    <defs>
      <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="80%">
        <stop offset="0%" stopColor={p.light} />
        <stop offset="55%" stopColor={p.body} />
        <stop offset="100%" stopColor={p.shade} />
      </radialGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff6c9" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#ffe28a" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#ffe28a" stopOpacity={0} />
      </radialGradient>
      <linearGradient id={`${id}-wing`} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="100%" stopColor={p.wing} />
      </linearGradient>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Stades
// ---------------------------------------------------------------------------
function StageEgg({ id, p, stirring }: { id: string; p: CompanionPalette; stirring: boolean }) {
  return (
    <g>
      {stirring && <circle cx={100} cy={116} r={80} fill={`url(#${id}-glow)`} className="cmp-a-glow" />}
      <Shadow rx={56} />
      <NestBack />
      <g className={stirring ? 'cmp-a-wiggle' : 'cmp-a-doze'}>
        <path d={EGG} fill={`url(#${id}-body)`} stroke={p.line} strokeWidth={3} />
        <EggDecor p={p} />
        <ellipse cx={80} cy={86} rx={7} ry={13} transform="rotate(24 80 86)" fill="#fff" opacity={0.7} />
        {stirring && (
          <g stroke={p.line} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M97 61 L103 74 L95 84 L105 95 L99 103" />
            <path d="M141 114 L131 118 L136 126 L127 133" />
            <path d="M60 136 L69 139 L65 147" />
          </g>
        )}
      </g>
      <NestFront />
      {stirring ? (
        <g>
          <Sparkle x={46} y={82} r={9} />
          <Sparkle x={156} y={72} r={11} delay={0.6} />
          <Sparkle x={160} y={128} r={7} delay={1.2} />
          <Sparkle x={38} y={130} r={6} delay={1.7} />
        </g>
      ) : (
        <g fill={p.line} fontFamily="Nunito, ui-rounded, system-ui, sans-serif" fontWeight={900} aria-hidden="true">
          <text x={138} y={70} fontSize={18} className="cmp-a-zz">z</text>
          <text x={150} y={52} fontSize={13} className="cmp-a-zz" style={{ animationDelay: '1.2s' }}>z</text>
        </g>
      )}
    </g>
  );
}

function StageHatch({ id, p }: { id: string; p: CompanionPalette }) {
  return (
    <g>
      <circle cx={100} cy={112} r={82} fill={`url(#${id}-glow)`} className="cmp-a-glow" />
      <Shadow rx={56} />
      <NestBack />
      <g className="cmp-a-peek">
        {/* tête qui sort */}
        <path
          d="M100 70 C125 70 139 88 139 108 C139 128 123 140 100 140 C77 140 61 128 61 108 C61 88 75 70 100 70 Z"
          fill={`url(#${id}-body)`}
          stroke={p.line}
          strokeWidth={3}
        />
        <Eyes lx={86} rx={114} y={102} ew={6.5} eh={8.5} />
        <Cheeks lx={74} rx={126} y={114} p={p} w={6.5} h={4} />
        <path d="M95 111 Q100 118 105 111 Z" fill={p.cheek} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        {/* chapeau de coquille */}
        <g transform="rotate(-14 100 70)">
          <path d={EGG_CAP} transform="translate(0 -8)" fill={`url(#${id}-body)`} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
          <path d={starPath(100, 58, 6, 0.5)} fill={p.spot} stroke={p.deep} strokeWidth={1.3} strokeLinejoin="round" />
        </g>
      </g>
      <path d={EGG_BOTTOM} fill={`url(#${id}-body)`} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
      <path d={starPath(82, 142, 6, 0.5)} fill={p.spot} stroke={p.deep} strokeWidth={1.3} strokeLinejoin="round" />
      <circle cx={118} cy={146} r={3.4} fill={p.spot} />
      {/* menottes sur le bord */}
      <ellipse cx={70} cy={121} rx={9} ry={7} fill={p.body} stroke={p.line} strokeWidth={2.5} />
      <ellipse cx={130} cy={121} rx={9} ry={7} fill={p.body} stroke={p.line} strokeWidth={2.5} />
      <NestFront />
      <Sparkle x={42} y={78} r={9} />
      <Sparkle x={160} y={66} r={11} delay={0.5} />
      <Sparkle x={164} y={124} r={7} delay={1.1} />
    </g>
  );
}

const BABY_BODY = 'M100 76 C134 76 150 104 150 132 C150 160 128 172 100 172 C72 172 50 160 50 132 C50 104 66 76 100 76 Z';
const BIG_BODY = 'M100 62 C140 62 158 98 158 132 C158 162 132 175 100 175 C68 175 42 162 42 132 C42 98 60 62 100 62 Z';

function Tuft({ p, id, x = 100, top = 76, big, noStar }: { p: CompanionPalette; id: string; x?: number; top?: number; big?: boolean; noStar?: boolean }) {
  const k = big ? 1.2 : 1;
  return (
    <g className="cmp-a-sway">
      <path
        d={`M${x - 9 * k} ${top + 6} C${x - 15 * k} ${top - 8 * k} ${x - 8 * k} ${top - 22 * k} ${x + 5 * k} ${top - 26 * k} C${x - 1 * k} ${top - 16 * k} ${x + 4 * k} ${top - 6 * k} ${x + 10 * k} ${top + 6} Z`}
        fill={`url(#${id}-body)`}
        stroke={p.line}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      {!noStar && <Star x={x + 7 * k} y={top - 29 * k} r={9 * k} className="cmp-a-glint" />}
    </g>
  );
}

/** Petite queue en nuage (stades Grand et Légendaire). */
function CloudTail({ p }: { p: CompanionPalette }) {
  return (
    <g className="cmp-a-sway">
      <g fill={p.line}>
        <circle cx={171} cy={141} r={8.5} />
        <circle cx={163} cy={154} r={11.5} />
        <circle cx={149} cy={164} r={13.5} />
      </g>
      <g fill={p.body}>
        <circle cx={171} cy={141} r={6} />
        <circle cx={163} cy={154} r={9} />
        <circle cx={149} cy={164} r={11} />
      </g>
      <circle cx={160} cy={150} r={3} fill="#fff" opacity={0.7} />
    </g>
  );
}

/** Auréole d'étoiles autour de la houppette (stade Légendaire). back = moitié arrière. */
function Halo({ back }: { back?: boolean }) {
  const cx = 100;
  const cy = 36;
  const rx = 36;
  const ry = 9;
  const stars = [0, 1, 2, 3, 4]
    .map((i) => (Math.PI * 2 * i) / 5 + Math.PI / 2)
    .map((a) => ({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), front: Math.sin(a) > 0.01 }))
    .filter((st) => (back ? !st.front : st.front));
  return (
    <g className="cmp-a-float">
      <path
        d={back ? `M${cx - rx} ${cy} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}` : `M${cx + rx} ${cy} A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`}
        fill="none"
        stroke={GOLD_EDGE}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={back ? 0.55 : 0.9}
      />
      {stars.map((st, i) => (
        <Star key={i} x={st.x} y={st.y} r={back ? 6 : 8} />
      ))}
    </g>
  );
}

function StageBaby({ id, p }: { id: string; p: CompanionPalette }) {
  return (
    <g>
      <Shadow rx={48} />
      <g className="cmp-a-breathe">
        <Tuft p={p} id={id} />
        <ellipse cx={80} cy={170} rx={13} ry={8} fill={p.shade} stroke={p.line} strokeWidth={2.5} />
        <ellipse cx={120} cy={170} rx={13} ry={8} fill={p.shade} stroke={p.line} strokeWidth={2.5} />
        <path d={BABY_BODY} fill={`url(#${id}-body)`} stroke={p.line} strokeWidth={3} />
        <ellipse cx={100} cy={152} rx={27} ry={14} fill={p.light} opacity={0.85} />
        <ellipse cx={76} cy={96} rx={8} ry={5} transform="rotate(-35 76 96)" fill="#fff" opacity={0.75} />
        <ellipse cx={53} cy={138} rx={7} ry={11} transform="rotate(28 53 138)" fill={p.body} stroke={p.line} strokeWidth={2.5} />
        <ellipse cx={147} cy={138} rx={7} ry={11} transform="rotate(-28 147 138)" fill={p.body} stroke={p.line} strokeWidth={2.5} />
        <Eyes lx={83} rx={117} y={121} ew={7.5} eh={10} />
        <Cheeks lx={69} rx={131} y={136} p={p} />
        <path d="M94 135 Q100 141 106 135" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      </g>
      <Sparkle x={38} y={88} r={7} delay={0.3} />
      <Sparkle x={164} y={100} r={8} delay={1.4} />
    </g>
  );
}

function Wings({ id, p, big }: { id: string; p: CompanionPalette; big: boolean }) {
  const top = big
    ? 'M58 112 C30 116 4 96 6 58 C34 56 58 80 64 102 Z'
    : 'M58 108 C36 110 16 94 16 70 C36 68 54 84 62 100 Z';
  const low = big
    ? 'M56 128 C34 140 12 136 4 118 C20 104 42 110 58 120 Z'
    : 'M54 124 C38 132 22 128 16 116 C28 106 44 110 56 118 Z';
  const wing = (
    <g>
      <path d={low} fill={`url(#${id}-wing)`} stroke={p.wingEdge} strokeWidth={2.4} strokeLinejoin="round" />
      <path d={top} fill={`url(#${id}-wing)`} stroke={p.wingEdge} strokeWidth={2.4} strokeLinejoin="round" />
      <path
        d={big ? 'M60 104 Q38 88 18 66' : 'M60 102 Q44 90 26 76'}
        fill="none"
        stroke={p.wingEdge}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      {big && <path d={sparklePath(14, 64, 6)} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1} />}
    </g>
  );
  return (
    <g>
      <g className="cmp-a-flap-l">{wing}</g>
      <g transform="translate(200 0) scale(-1 1)">
        <g className="cmp-a-flap-l">{wing}</g>
      </g>
    </g>
  );
}

function StageGrand({ id, p }: { id: string; p: CompanionPalette }) {
  return (
    <g>
      <Shadow rx={54} />
      <Wings id={id} p={p} big={false} />
      <g className="cmp-a-breathe">
        <CloudTail p={p} />
        <Tuft p={p} id={id} top={62} big />
        <ellipse cx={78} cy={173} rx={14} ry={8} fill={p.shade} stroke={p.line} strokeWidth={2.5} />
        <ellipse cx={122} cy={173} rx={14} ry={8} fill={p.shade} stroke={p.line} strokeWidth={2.5} />
        <path d={BIG_BODY} fill={`url(#${id}-body)`} stroke={p.line} strokeWidth={3} />
        <ellipse cx={100} cy={152} rx={33} ry={18} fill={p.light} opacity={0.85} />
        <path d={starPath(100, 152, 7, 0.5)} fill={p.spot} stroke={p.deep} strokeWidth={1.4} strokeLinejoin="round" />
        <ellipse cx={72} cy={84} rx={10} ry={6} transform="rotate(-35 72 84)" fill="#fff" opacity={0.75} />
        <ellipse cx={46} cy={140} rx={8} ry={13} transform="rotate(26 46 140)" fill={p.body} stroke={p.line} strokeWidth={2.5} />
        <ellipse cx={154} cy={140} rx={8} ry={13} transform="rotate(-26 154 140)" fill={p.body} stroke={p.line} strokeWidth={2.5} />
        <Eyes lx={81} rx={119} y={112} ew={8.5} eh={11} />
        <Cheeks lx={65} rx={135} y={129} p={p} w={9} h={5.5} />
        <path d="M93 127 Q100 136 107 127 Z" fill={p.cheek} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      <Sparkle x={30} y={160} r={7} delay={0.4} />
      <Sparkle x={176} y={110} r={8} delay={1.5} />
    </g>
  );
}

function StageLegend({ id, p }: { id: string; p: CompanionPalette }) {
  return (
    <g>
      <circle cx={100} cy={112} r={92} fill={`url(#${id}-glow)`} className="cmp-a-glow" />
      <Shadow rx={56} />
      <Wings id={id} p={p} big />
      <g className="cmp-a-breathe">
        <CloudTail p={p} />
        <Halo back />
        <Tuft p={p} id={id} top={62} big noStar />
        <Halo />
        <ellipse cx={78} cy={173} rx={14} ry={8} fill={p.shade} stroke={p.line} strokeWidth={2.5} />
        <ellipse cx={122} cy={173} rx={14} ry={8} fill={p.shade} stroke={p.line} strokeWidth={2.5} />
        <path d={BIG_BODY} fill={`url(#${id}-body)`} stroke={p.line} strokeWidth={3} />
        <ellipse cx={100} cy={152} rx={33} ry={18} fill={p.light} opacity={0.85} />
        <Star x={100} y={151} r={10} className="cmp-a-glint" />
        <g fill={p.spot}>
          <circle cx={58} cy={110} r={3} />
          <circle cx={64} cy={100} r={2.2} />
          <circle cx={142} cy={110} r={3} />
          <circle cx={136} cy={100} r={2.2} />
        </g>
        <ellipse cx={72} cy={84} rx={10} ry={6} transform="rotate(-35 72 84)" fill="#fff" opacity={0.75} />
        <ellipse cx={46} cy={140} rx={8} ry={13} transform="rotate(26 46 140)" fill={p.body} stroke={p.line} strokeWidth={2.5} />
        <ellipse cx={154} cy={140} rx={8} ry={13} transform="rotate(-26 154 140)" fill={p.body} stroke={p.line} strokeWidth={2.5} />
        <Eyes lx={81} rx={119} y={112} ew={8.5} eh={11} />
        <Cheeks lx={65} rx={135} y={129} p={p} w={9} h={5.5} />
        <path d="M92 126 Q100 137 108 126 Z" fill={p.cheek} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      <Sparkle x={24} y={168} r={7} delay={0.2} />
      <Sparkle x={184} y={170} r={7} delay={1.1} />
      <Sparkle x={182} y={88} r={6} delay={1.8} />
      <Sparkle x={18} y={92} r={6} delay={0.9} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Composant public
// ---------------------------------------------------------------------------
export function CompanionArt({
  stage,
  hue = 270,
  size = 200,
  animated = true,
  label,
  decorative,
  silhouette,
  className,
  style,
}: CompanionArtProps) {
  const s = clampStage(stage);
  const id = 'cmp' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const p = companionPalette(hue);
  const aria = label ?? (silhouette ? 'Stade mystère, pas encore atteint' : `Compagnon — ${COMPANION_STAGES[s].label}`);

  let body: ReactNode;
  if (s <= 1) body = <StageEgg id={id} p={p} stirring={s === 1} />;
  else if (s === 2) body = <StageHatch id={id} p={p} />;
  else if (s === 3) body = <StageBaby id={id} p={p} />;
  else if (s === 4) body = <StageGrand id={id} p={p} />;
  else body = <StageLegend id={id} p={p} />;

  const cls = ['cmp-art', `cmp-art--s${s}`, animated && !silhouette && 'is-animated', silhouette && 'is-silhouette', className]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cls}
      style={style}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : aria}
      focusable="false"
    >
      {!decorative && <title>{aria}</title>}
      <Gradients id={id} p={p} />
      {body}
    </svg>
  );
}
