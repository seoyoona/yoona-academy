/**
 * Repair Korean bold that CommonMark refuses to render.
 *
 * A closing `**` is only a valid emphasis-closer when it is "right-flanking".
 * When a bold ends in punctuation — e.g. `**지니 불순도(Gini impurity)**` — and is
 * immediately followed by a Hangul particle (는/이/은/…), the closing `**` is
 * preceded by `)` and followed by a letter, which fails the flanking rule, so
 * the whole run renders as literal asterisks. Korean grammar attaches the
 * particle with no space, so the usual "just add a space" fix isn't an option.
 *
 * Rendering these runs as explicit <strong> makes every `**…**`-before-Hangul
 * uniform (the ones that already worked are unchanged visually), with no change
 * to the actual text. Code regions are skipped so Python's `**` operator and any
 * inline/fenced code are never touched.
 */
export function fixBrokenBold(md: string): string {
  return md
    // Capturing split keeps code regions at odd indices, prose at even indices.
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((segment, i) =>
      i % 2 === 1
        ? segment
        : segment.replace(
            // A well-formed **X** pair immediately followed by a Hangul
            // syllable. X carries no other emphasis marker (`*`/`_`) and no edge
            // spaces, so wrapping it in raw <strong> can't strip nested italics.
            /\*\*([^\s*_](?:[^*_\n]*[^\s*_])?)\*\*(?=[가-힣])/g,
            "<strong>$1</strong>",
          ),
    )
    .join("");
}
