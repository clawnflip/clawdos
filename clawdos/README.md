# clawdos

ClawdOS Terminal as a publishable npm CLI package.

## Install

```bash
npm install -g clawdos
```

Local dev install from this repo:

```bash
cd clawdos
npm link
```

## Run

```bash
clawdos
```

## Highlights

- Persistent user profile, theme, alias and notes in `~/.clawdos/state.json`
- Rich command set for shell-like workflows
- Script runner (`run <scriptfile>`) for repeatable command sequences

## Command Index

- `help`, `clear`, `exit`, `version`, `about`
- `whoami`, `setname <name>`, `theme [matrix|arctic|amber]`
- `pwd`, `cd <path>`, `ls [path]`, `tree [path] [depth]`, `cat <file>`
- `mkdir <dir>`, `touch <file>`, `write <file> <text>`, `rm <path>`
- `echo <text>`, `date`, `history [n]`, `calc <expr>`, `uuid`
- `hash <text>`, `b64enc <text>`, `b64dec <base64>`
- `alias <name> <command>`, `unalias <name>`, `run <scriptfile>`
- `note add <text>`, `note list`, `note rm <index>`

## Publish

```bash
cd clawdos
npm login
npm publish --access public
```

Before publishing, verify package name availability (`clawdos`) and bump version.
