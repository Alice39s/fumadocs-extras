// Packs the library, installs the tarball into a Next.js + Fumadocs app per UI setup, builds and
// serves each app, then checks the menu in Chromium. Run with `node e2e/run.ts [variant...]`.
import { spawn } from 'node:child_process'
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { checkApp } from './checks.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const work = `${root}.e2e/`
const latest = '16.16.2'

interface Variant {
  name: string
  /** package name the app imports UI components from */
  ui: string
  /** entry of fumadocs-extras the app uses */
  entry: string
  deps: Record<string, string>
}

const variants: Variant[] = [
  {
    name: 'radix',
    ui: 'fumadocs-ui',
    entry: 'fumadocs-extras/page-actions',
    deps: { 'fumadocs-ui': latest, 'fumadocs-core': latest },
  },
  {
    // the layout `create-fumadocs-app` generates for Next.js
    name: 'base-ui-alias',
    ui: 'fumadocs-ui',
    entry: 'fumadocs-extras/page-actions',
    deps: { 'fumadocs-ui': `npm:@fumadocs/base-ui@${latest}`, 'fumadocs-core': latest },
  },
  {
    name: 'base-ui',
    ui: '@fumadocs/base-ui',
    entry: 'fumadocs-extras/page-actions/base-ui',
    deps: { '@fumadocs/base-ui': latest, 'fumadocs-core': latest },
  },
  {
    // lowest version in the peer range
    name: 'radix-min',
    ui: 'fumadocs-ui',
    entry: 'fumadocs-extras/page-actions',
    deps: { 'fumadocs-ui': '16.10.0', 'fumadocs-core': '16.10.0' },
  },
]

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit' })
    child.on('exit', code =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`)),
    )
  })
}

async function serve(cwd: string, port: number) {
  // its own process group, so stopping it also stops the Next.js server under pnpm
  const child = spawn('pnpm', ['exec', 'next', 'start', '-p', String(port)], {
    cwd,
    stdio: 'pipe',
    detached: true,
  })
  child.stderr.pipe(process.stderr)
  await new Promise<void>((resolve, reject) => {
    child.on('exit', code => reject(new Error(`next start exited with ${code}`)))
    child.stdout.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('Ready')) resolve()
    })
  })
  return {
    stop() {
      child.removeAllListeners('exit')
      process.kill(-child.pid!, 'SIGTERM')
    },
  }
}

async function setup(variant: Variant, tarball: string) {
  const dir = `${work}${variant.name}/`
  await rm(dir, { recursive: true, force: true })
  await cp(`${root}e2e/fixture`, dir, { recursive: true })

  await writeFile(
    `${dir}package.json`,
    JSON.stringify(
      {
        name: `e2e-${variant.name}`,
        private: true,
        type: 'module',
        dependencies: {
          ...variant.deps,
          'fumadocs-extras': `file:${tarball}`,
          'next': '16.3.8',
          'react': '^19.3.0',
          'react-dom': '^19.3.0',
        },
        devDependencies: {
          '@tailwindcss/postcss': '^4.3.3',
          '@types/node': '^26.6.4',
          '@types/react': '^19.3.0',
          '@types/react-dom': '^19.3.0',
          'tailwindcss': '^4.3.3',
          'typescript': '^6.0.3',
        },
      },
      null,
      2,
    ),
  )
  // its own workspace root, away from the library workspace
  await writeFile(
    `${dir}pnpm-workspace.yaml`,
    `packages: []\nminimumReleaseAge: 0\nallowBuilds:\n  sharp: true\n  unrs-resolver: true\n`,
  )
  await mkdir(`${dir}lib`, { recursive: true })
  await writeFile(
    `${dir}lib/ui.ts`,
    [
      `export { RootProvider } from '${variant.ui}/provider/next'`,
      `export { DocsLayout } from '${variant.ui}/layouts/docs'`,
      `export { DocsBody, DocsPage, DocsTitle, MarkdownCopyButton } from '${variant.ui}/layouts/docs/page'`,
      `export { ViewOptionsPopover } from '${variant.entry}'`,
      '',
    ].join('\n'),
  )
  await writeFile(
    `${dir}app/global.css`,
    [
      `@import 'tailwindcss';`,
      `@import '${variant.ui}/css/neutral.css';`,
      `@import '${variant.ui}/css/preset.css';`,
      `@import 'fumadocs-extras/css/preset.css';`,
      '',
    ].join('\n'),
  )
  return dir
}

const only = process.argv.slice(2)
const selected = only.length > 0 ? variants.filter(v => only.includes(v.name)) : variants
if (selected.length === 0) throw new Error(`unknown variants: ${only.join(', ')}`)

await mkdir(work, { recursive: true })
for (const file of await readdir(work)) if (file.endsWith('.tgz')) await rm(`${work}${file}`)
await run('pnpm', ['pack', '--pack-destination', work], root)
const tarball = (await readdir(work)).find(file => file.endsWith('.tgz'))
if (!tarball) throw new Error('pnpm pack wrote no tarball')

let failed = 0
for (const [i, variant] of selected.entries()) {
  console.log(`\n=== ${variant.name}`)
  const dir = await setup(variant, `${work}${tarball}`)
  await run('pnpm', ['install', '--no-frozen-lockfile'], dir)
  // `next build` also type checks the app against the published declarations
  await run('pnpm', ['exec', 'next', 'build'], dir)

  const port = 4400 + i
  const server = await serve(dir, port)
  try {
    failed += await checkApp(`http://localhost:${port}`, `${work}shots/${variant.name}`)
  } finally {
    server.stop()
  }
}

console.log(failed ? `\n${failed} FAILED` : '\nall variants ok')
if (failed) process.exitCode = 1
