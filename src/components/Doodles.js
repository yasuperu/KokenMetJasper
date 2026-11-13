/*
  Handgetekende etenstekeningen, losjes geïnspireerd op kinderkookboek-
  illustraties, in gedempte kleuren. Allemaal in een 64×64 viewBox.
*/

const INK = "var(--ink)";
const line = { stroke: INK, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };

export function Leaf({ color = "var(--leaf)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M32 5c17 11 21 33 1 54C12 39 15 16 32 5z" fill={color} {...line} />
      <path d="M32 12c1 14 1 30 1 47" fill="none" {...line} />
      <path d="M32 24l-8-6M33 33l-10-6M33 42l-9-5M32 24l8-6M33 33l10-6M33 42l9-5" fill="none" {...line} strokeWidth={1.8} />
    </svg>
  );
}

export function LemonSlice({ color = "var(--mustard)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <circle cx="32" cy="32" r="25" fill={color} {...line} />
      <circle cx="32" cy="32" r="19" fill="var(--cream-light)" stroke="none" />
      <path d="M32 15v34M15 32h34M20 20l24 24M44 20L20 44" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" />
      <circle cx="32" cy="32" r="3" fill={color} />
    </svg>
  );
}

export function Tomato({ color = "var(--tomato)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M32 16c15-1 25 9 24 22-1 13-11 20-24 20S8 51 8 38c0-13 9-21 24-22z" fill={color} {...line} />
      <path d="M32 18l-9-5 5 7-9 2 10 1-2 7 5-6 5 6-2-7 10-1-9-2 5-7z" fill="var(--leaf)" {...line} strokeWidth={1.8} />
      <path d="M17 34c1-4 3-7 6-8" fill="none" stroke="var(--cream-light)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export function PeaPod({ color = "var(--leaf-light)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M10 50C18 30 34 14 54 10 52 30 36 48 10 50z" fill={color} {...line} />
      <circle cx="22" cy="40" r="4.5" fill="var(--leaf)" {...line} strokeWidth={1.8} />
      <circle cx="31" cy="31" r="4.5" fill="var(--leaf)" {...line} strokeWidth={1.8} />
      <circle cx="40" cy="22" r="4.5" fill="var(--leaf)" {...line} strokeWidth={1.8} />
      <path d="M54 10c3-3 4-5 3-8" fill="none" {...line} />
    </svg>
  );
}

export function Garlic({ color = "var(--plum-light)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M32 8c-2 8-6 10-12 14-9 6-12 14-9 23 3 9 12 13 21 13s18-4 21-13c3-9 0-17-9-23-6-4-10-6-12-14z" fill="var(--cream-light)" {...line} />
      <path d="M32 22c-5 8-7 20-4 35M32 22c5 8 7 20 4 35M22 26c-6 8-6 20 0 29M42 26c6 8 6 20 0 29" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <path d="M26 58h12" fill="none" {...line} />
    </svg>
  );
}

export function Chili({ color = "var(--tomato)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M46 16c-4 14-14 30-36 40 4 2 12 2 20-3 14-8 22-20 24-33z" fill={color} {...line} />
      <path d="M46 16c2-3 6-4 9-2 2 2 1 5-1 6" fill="var(--leaf)" {...line} />
      <path d="M50 14c1-4 4-8 8-9" fill="none" {...line} />
    </svg>
  );
}

export function Beet({ color = "var(--plum)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M30 22c-6-8-14-12-20-10 2 7 10 12 20 12M34 22c4-9 11-15 18-15-1 8-8 14-18 16" fill="var(--leaf)" {...line} />
      <path d="M32 24c12 0 18 8 17 17-1 7-8 11-14 13l-3 8-3-8c-6-2-13-6-14-13-1-9 5-17 17-17z" fill={color} {...line} />
      <path d="M26 34c2 4 2 8 0 12M38 34c-2 4-2 8 0 12" fill="none" stroke="var(--rose)" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

export function Carrot({ color = "var(--carrot)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M44 20L10 56c-2 2 0 4 2 2l36-34z" fill={color} {...line} />
      <path d="M44 20c8-4 14-4 16-2M44 20c2-8 2-14 0-16M46 22c4-6 9-9 12-9" fill="none" stroke="var(--leaf)" strokeWidth={3} strokeLinecap="round" />
      <path d="M30 34l5 5M22 43l4 4" fill="none" {...line} strokeWidth={1.8} />
    </svg>
  );
}

export function Whisk({ color = "var(--rose)", ...props }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <path d="M40 24l16-16" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <path d="M40 24c-10-2-26 6-30 20-2 8 4 12 12 8 12-6 18-20 18-28zM40 24c-8 2-20 14-22 24M40 24c-4 6-12 18-18 24" fill="none" {...line} />
    </svg>
  );
}

export const DOODLES = { Leaf, LemonSlice, Tomato, PeaPod, Garlic, Chili, Beet, Carrot, Whisk };
