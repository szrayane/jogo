# Lúmen

Arcade de sobrevivência no browser. Você é uma faísca. A aura ataca sozinha. Sombras vêm em ondas. Cada nível muda a run.

Feito para portfólio e processo seletivo: dá para jogar em 10 segundos, funciona no celular e sobe na Vercel sem backend.

**Stack:** Vue 3 · TypeScript · Vite · Canvas 2D · Web Audio · localStorage

## Como jogar

- **Mover:** WASD, setas ou arrastar o dedo
- **Atacar:** automático — a aura pulsa e os satélites orbitam
- **Evoluir:** pegue fragmentos azuis, escolha um eco
- **Pausar / som:** Espaço e `M`

Sobreviva o máximo que puder. O recorde fica salvo neste navegador.

## Rodar local

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Deploy na Vercel

1. Entre em [vercel.com](https://vercel.com) e importe [este repositório](https://github.com/szrayane/jogo)
2. Framework: **Vite** (detecta sozinho)
3. Build: `npm run build` · pasta: `dist`

Ou no terminal, com a CLI da Vercel:

```bash
npx vercel
```

O `vercel.json` já trata a SPA.

## O que o projeto mostra

- **Vue 3 Composition API** com telas (menu, run, level-up, game over)
- **TypeScript** no loop do jogo, entidades e upgrades
- **Game loop** com `requestAnimationFrame`, colisão círculo-círculo e partículas
- **Roguelite curto:** 10 ecos diferentes, combo, ondas e 4 tipos de inimigo
- **Mobile:** pointer capture + HUD tocável
- **Som sem assets:** osciladores no Web Audio API
- **Deploy estático** pronto para Vercel, no mesmo fluxo do portfólio

Arquitetura em `src/game`:

| arquivo | papel |
| --- | --- |
| `engine.ts` | loop, combate, spawn, render |
| `input.ts` | teclado e pointer |
| `upgrades.ts` | player e ecos |
| `audio.ts` | SFX sintético |
| `scores.ts` | top 5 no `localStorage` |

## Autora

[Rayane Souza](https://github.com/szrayane) · fullstack · São Paulo
