# 🌌 Aurora World

> Um platformer 2D inspirado nos clássicos jogos de plataforma, com mapa-mundo, fases, inimigos, moedas, power-ups e muita aventura.

🎮 **Jogue diretamente no navegador** e explore os diferentes mundos de Aurora!

---

## 🕹️ Sobre o jogo

**Aurora World** é um jogo de plataforma 2D desenvolvido para navegador, inspirado na experiência dos clássicos platformers.

O jogador deve atravessar diferentes fases, enfrentar inimigos, coletar moedas e utilizar power-ups enquanto explora um mapa-mundo com diferentes regiões.

O projeto é **original** e não utiliza personagens, músicas ou assets de franquias existentes. A inspiração está apenas no gênero e nas mecânicas tradicionais dos jogos de plataforma.

O jogo foi desenvolvido como projeto de **portfólio e demonstração de habilidades em desenvolvimento web e game development**.

---

## ✨ Funcionalidades

* 🗺️ **Mapa-mundo** para seleção das fases
* 🏃 Movimentação e corrida
* 🦘 Pulo com altura variável
* 🪙 Sistema de moedas
* ❓ Blocos interativos
* 🍓 Power-up que concede um hit extra
* 👾 Inimigos derrotados ao pular sobre eles
* ⭐ Objetivo no final das fases
* ❤️ Sistema de vidas
* 💾 Salvamento do progresso
* 🎵 Efeitos sonoros utilizando Web Audio
* 📱 Controles adaptados para dispositivos móveis
* 🎮 Suporte para teclado e controles virtuais
* ⏸️ Sistema de pausa
* 🔇 Controle de áudio

---

## 🌎 Mundos

O jogo conta atualmente com diferentes regiões para explorar:

| Mundo | Região      |
| ----- | ----------- |
| 🌸 1  | Bosque Rosa |
| ❄️ 2  | Pico Gelado |
| 🌊 3  | Baía Aurora |
| 🌃 4  | Centro Neon |

---

## 🎮 Controles

### 💻 Teclado

| Ação            | Controles                 |
| --------------- | ------------------------- |
| Mover           | `←` `→` ou `A` `D`        |
| Pular           | `Espaço`, `K`, `Z` ou `↑` |
| Correr          | `Shift`, `J` ou `X`       |
| Selecionar fase | `←` `→`                   |
| Entrar na fase  | `Enter`                   |
| Pausar          | `Esc`                     |
| Silenciar       | `M`                       |

### 📱 Celular

O jogo também possui controles virtuais na tela para dispositivos móveis.

---

## 🪙 Mecânicas

### Moedas

Colete moedas espalhadas pelas fases.

Ao alcançar **100 moedas**, o jogador recebe **1 vida extra**.

### ❓ Blocos

Os blocos `?` podem esconder recompensas, como:

* 🪙 Moedas
* 🍓 Power-ups

### 👾 Inimigos

Os inimigos podem ser derrotados pulando sobre eles.

Tenha cuidado para não colidir com eles lateralmente!

### 🍓 Power-up

Alguns blocos podem liberar uma fruta que concede ao jogador **um hit extra**, aumentando suas chances de completar a fase.

### ⭐ Objetivo

Para completar uma fase, avance pelo cenário e alcance a **estrela no final do percurso**.

---

## 🧠 Física e Gameplay

O projeto implementa diversas técnicas utilizadas em jogos de plataforma, incluindo:

* Coyote Time
* Jump Buffer
* Pulo com altura variável
* Cancelamento de pulo
* Plataformas One-Way
* Colisão AABB
* Sistema de câmera
* Tilemap
* Entidades e colisões
* Física de movimentação

Essas mecânicas tornam os controles mais responsivos e proporcionam uma experiência de plataforma mais agradável.

---

## 🛠️ Tecnologias

O projeto foi desenvolvido utilizando:

* **Vue 3** — interface e HUD
* **TypeScript** — lógica e programação do jogo
* **Vite** — ambiente de desenvolvimento e build
* **Canvas 2D** — renderização do jogo
* **Web Audio API** — efeitos sonoros
* **localStorage** — salvamento do progresso

---

## 📁 Estrutura do projeto

A lógica principal do jogo está organizada dentro de `src/game`:

```text
src/
└── game/
    ├── engine.ts   # Loop principal, física, combate e renderização
    ├── levels.ts   # Mapas e fases
    ├── input.ts    # Controles de teclado e controles virtuais
    ├── audio.ts    # Efeitos sonoros
    └── save.ts     # Sistema de salvamento
```

Essa separação facilita a manutenção e evolução do projeto.

---

## 🚀 Como executar localmente

### Pré-requisitos

Antes de começar, você precisa ter instalado:

* [Node.js](https://nodejs.org/)
* npm

### Instalação

Clone o repositório:

```bash
git clone https://github.com/szrayane/jogo.git
```

Entre na pasta:

```bash
cd jogo
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Depois, acesse o endereço informado pelo Vite no terminal.

---

## 📦 Build de produção

Para gerar a versão de produção:

```bash
npm run build
```

Para visualizar o build localmente:

```bash
npm run preview
```

---

## ☁️ Deploy

O projeto pode ser publicado como uma aplicação estática na **Vercel**.

Configuração utilizada:

```text
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

---

## 📱 Compatibilidade

O jogo foi desenvolvido pensando em diferentes dispositivos:

* 💻 Desktop
* 📱 Smartphones
* 🌐 Navegadores modernos

Além do teclado, dispositivos móveis possuem controles virtuais para interação com o jogo.

---

## 🎯 Objetivos do projeto

Além de proporcionar uma experiência divertida, o projeto demonstra conhecimentos em:

* Desenvolvimento de jogos 2D
* TypeScript
* Vue 3
* Canvas API
* Física de jogos
* Detecção de colisões
* Game loop
* Sistemas de input
* Áudio para jogos
* Persistência de dados
* Desenvolvimento responsivo
* Deploy de aplicações web

---

## 👩‍💻 Autora

**Rayane Souza**

Fullstack Developer · São Paulo

---

## 📄 Licença

Este projeto é destinado a fins de estudo, portfólio e desenvolvimento pessoal.

---

⭐ Se você gostou do projeto, considere deixar uma estrela no repositório!
