# Aurora World

Platformer 2D no espírito de **Super Mario World**: mapa-mundo, pulo com altura variável, moedas, blocos, inimigos que tomam stomp e um castelo no fim.

É um jogo **original**. Não usa personagem, música, fase nem asset da Nintendo — só o gênero que todo mundo reconhece.

Feito para portfólio e processo seletivo: joga no browser, funciona no celular, sobe na Vercel.

**Stack:** Vue 3 · TypeScript · Vite · Canvas 2D · Web Audio · localStorage

## Como jogar

- **Andar:** setas ou A/D
- **Pular:** Espaço, K, Z ou seta para cima — solte cedo para pular baixo
- **Correr:** Shift, J ou X
- **Mapa:** esquerda/direita escolhe a fase, Enter entra
- **Celular:** teclas A/B e setas na tela
- **M** silencia · **Esc** pausa

Pise nas **bolotas** por cima. Blocos `?` soltam moedas ou a **fruta** (um hit extra). 100 moedas = 1 vida. Chegue na estrela.

Mundos:

1. Bosque Rosa
2. Pico Gelado
3. Baía Aurora
4. Centro Neon

## Rodar local

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## Deploy na Vercel

Importe [este repositório](https://github.com/szrayane/jogo). Framework **Vite**, build `npm run build`, pasta `dist`.

## O que o projeto mostra

- Física de platformer (coyote time, jump buffer, pulo cortado, plataformas one-way)
- Tilemap, câmera, colisão AABB e entidades
- Overworld com progresso salvo
- Vue 3 na HUD/telas + loop em TypeScript
- Controles touch e teclado
- Deploy estático

Arquitetura em `src/game`:

| arquivo | papel |
| --- | --- |
| `engine.ts` | loop, física, combate, render |
| `levels.ts` | mapa-mundo e as 3 fases |
| `input.ts` | teclado e virtual pad |
| `audio.ts` | SFX sintético |
| `save.ts` | fases liberadas |

## Autora

[Rayane Souza](https://github.com/szrayane) · fullstack · São Paulo
