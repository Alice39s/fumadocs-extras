import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { Scanner } from '@tailwindcss/oxide'
import type { PackUserConfig } from 'vite-plus/pack'

const src = fileURLToPath(new URL('../src', import.meta.url))
const outDir = fileURLToPath(new URL('../css', import.meta.url))

/**
 * Write `css/preset.css`, listing every class the components use, so apps only need to
 * import it instead of pointing Tailwind CSS at `node_modules`.
 */
export function PresetCss(): PackUserConfig['plugins'] {
  return {
    name: 'fumadocs-extras:preset-css',
    async buildStart() {
      const scanner = new Scanner({
        sources: [{ base: src, pattern: '**/*.{ts,tsx}', negated: false }],
      })
      const names = scanner.scan().toSorted()
      await mkdir(outDir, { recursive: true })
      await writeFile(
        `${outDir}/preset.css`,
        `@source inline(${JSON.stringify(names.join(' '))});\n`,
      )
    },
  }
}
