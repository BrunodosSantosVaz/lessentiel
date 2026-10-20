<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/banner-dark.svg">
  <img alt="L’Essentiel — Menos ruído. Mais leitura." src="assets/brand/banner.svg" width="100%">
</picture>

<br><br>

**Uma extensão para transformar páginas web e PDFs locais em uma leitura tranquila.**

<br>

[![Release](https://img.shields.io/github/v/release/BrunodosSantosVaz/lessentiel?include_prereleases&style=flat-square&label=release&labelColor=2C2E3C&color=626470)](https://github.com/BrunodosSantosVaz/lessentiel/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/BrunodosSantosVaz/lessentiel/bb-ci.yml?branch=main&style=flat-square&label=CI&labelColor=2C2E3C)](https://github.com/BrunodosSantosVaz/lessentiel/actions/workflows/bb-ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/BrunodosSantosVaz/lessentiel/bb-codeql.yml?style=flat-square&label=CodeQL&labelColor=2C2E3C)](https://github.com/BrunodosSantosVaz/lessentiel/actions/workflows/bb-codeql.yml)
[![License: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-626470?style=flat-square&labelColor=2C2E3C)](LICENSE)
<br>
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/fcenhpjbliogldghnalpcnibefemhdof?style=flat-square&logo=googlechrome&logoColor=FFFFFF&label=Chrome%20Web%20Store&labelColor=2C2E3C&color=626470)](https://chromewebstore.google.com/detail/l%E2%80%99essentiel/fcenhpjbliogldghnalpcnibefemhdof)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-626470?style=flat-square&labelColor=2C2E3C)](wxt.config.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-WXT-626470?style=flat-square&logo=typescript&logoColor=FFFFFF&labelColor=2C2E3C)](https://wxt.dev)
[![Idiomas](https://img.shields.io/badge/idiomas-pt--BR%20%C2%B7%20en%20%C2%B7%20es-626470?style=flat-square&labelColor=2C2E3C)](public/_locales)

<br>

<a href="https://chromewebstore.google.com/detail/l%E2%80%99essentiel/fcenhpjbliogldghnalpcnibefemhdof"><img src="https://img.shields.io/badge/Instalar-Chrome%20Web%20Store-2C2E3C?style=for-the-badge&logo=googlechrome&logoColor=FFFFFF" alt="Instalar pela Chrome Web Store"></a>
<a href="https://github.com/BrunodosSantosVaz/lessentiel/releases"><img src="https://img.shields.io/badge/Baixar-ZIP-626470?style=for-the-badge&logo=github&logoColor=FFFFFF" alt="Baixar o ZIP"></a>
<a href="https://github.com/BrunodosSantosVaz/lessentiel/wiki/Uso-e-instalacao"><img src="https://img.shields.io/badge/Como%20instalar-Guia-626470?style=for-the-badge&logo=bookstack&logoColor=FFFFFF" alt="Como instalar"></a>
<a href="https://github.com/BrunodosSantosVaz/lessentiel/wiki"><img src="https://img.shields.io/badge/Wiki-Documenta%C3%A7%C3%A3o-626470?style=for-the-badge&logo=readthedocs&logoColor=FFFFFF" alt="Documentação"></a>

</div>

<!-- Capturas de tela: adicione imagens reais do leitor em assets/screenshots/ e descomente.
<p align="center">
  <img src="assets/screenshots/pagina-web.png" alt="Leitor em uma página web" width="49%">
  <img src="assets/screenshots/pdf-local.png" alt="Leitor em um PDF local" width="49%">
</p>
-->

<br>

<details>
<summary><b>Sumário</b></summary>

- [O texto em primeiro lugar](#-o-texto-em-primeiro-lugar)
- [Funcionalidades](#-funcionalidades)
- [Instalação](#-instalação)
- [Como usar](#-como-usar)
- [Temas e fontes](#-temas-e-fontes)
- [Privacidade e permissões](#-privacidade-e-permissões)
- [Arquitetura](#-arquitetura)
- [Desenvolvimento](#-desenvolvimento)
- [Contribuindo](#-contribuindo)
- [Segurança](#-segurança)
- [Licença](#-licença)

</details>

## 📖 O texto em primeiro lugar

<table>
<tr>
<td width="33%" valign="top">

### 🎚️ Leia no seu ritmo
Temas, fontes incluídas, tamanho, alinhamento, largura e rolagem automática.

</td>
<td width="33%" valign="top">

### 🧭 Mantenha o contexto
Índice hierárquico, citações, listas, tabelas, código e imagens editoriais opcionais.

</td>
<td width="33%" valign="top">

### 🔒 Fique no seu dispositivo
Processamento local de texto e preferências, sem conta ou sincronização.

</td>
</tr>
</table>

## ✨ Funcionalidades

| | Leitura | | Navegação |
|:-:|---|:-:|---|
| 🌐 | Extrai o texto principal de páginas web | 📑 | Índice hierárquico lateral com os títulos do artigo |
| 📄 | Abre PDFs locais e recompõe o texto em parágrafos e uma coluna | ⌨️ | Atalho <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> |
| 🔤 | Quatro fontes de leitura, três delas incluídas no pacote | 🖱️ | Menu de contexto *Abrir no L’Essentiel* |
| 🎨 | Temas claro, sépia, escuro, preto e automático | ⚡ | Ativação automática em sites escolhidos e em arquivos locais |
| ↔️ | Tamanho, alinhamento e largura da coluna | 📊 | Barra de progresso de leitura |
| ▶️ | Rolagem automática | 🖨️ | Impressão limpa, só com o texto |
| 🖼️ | Imagens editoriais opcionais | 🌍 | Interface em português, inglês e espanhol |

## 🚀 Instalação

<a href="https://chromewebstore.google.com/detail/l%E2%80%99essentiel/fcenhpjbliogldghnalpcnibefemhdof"><img src="https://img.shields.io/badge/Instalar%20na%20Chrome%20Web%20Store-2C2E3C?style=for-the-badge&logo=googlechrome&logoColor=FFFFFF" alt="Instalar na Chrome Web Store"></a>

A forma mais simples, com atualizações automáticas.

**Versão: [0.1.1](https://github.com/BrunodosSantosVaz/lessentiel/releases/tag/v0.1.1)** · [Baixar ZIP](https://github.com/BrunodosSantosVaz/lessentiel/releases/download/v0.1.1/lessentiel-v0.1.1-universal.zip)

| Navegador | Suporte |
|---|---|
| <img src="https://img.shields.io/badge/-Chrome-2C2E3C?style=flat-square&logo=googlechrome&logoColor=FFFFFF" alt="Chrome"> | ✅ |
| <img src="https://img.shields.io/badge/-Edge-2C2E3C?style=flat-square&logo=microsoftedge&logoColor=FFFFFF" alt="Edge"> | ✅ |
| Outros Chromium (por exemplo, Brave) | Esperado, sem teste oficial |

<details>
<summary><b>Instalação manual pelo ZIP</b></summary>

1. Baixe o ZIP da versão desejada em [Releases](https://github.com/BrunodosSantosVaz/lessentiel/releases). As prévias estão identificadas como homologação.
2. Extraia o arquivo.
3. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta extraída.

Detalhes, acesso a arquivos, PDFs compatíveis e limitações estão no [guia de uso](https://github.com/BrunodosSantosVaz/lessentiel/wiki/Uso-e-instalacao).

</details>

## 🖱️ Como usar

1. Abra um artigo ou um PDF local.
2. Clique no ícone do L’Essentiel, use <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> ou escolha **Abrir no L’Essentiel** no menu de contexto.
3. Ajuste tema, fonte, tamanho, alinhamento e largura na barra superior.
4. Repita o comando para voltar à página original.

> [!NOTE]
> PDFs locais abrem primeiro no visualizador do navegador. Ative e desative o leitor manualmente. Para ler arquivos locais, permita o acesso a URLs de arquivo nos detalhes da extensão.

## 🎨 Temas e fontes

| Tema | Fundo | Texto | Link |
|---|:-:|:-:|:-:|
| **Claro** | ![#FFFFFF](https://placehold.co/14x14/FFFFFF/FFFFFF.png) `#FFFFFF` | ![#222222](https://placehold.co/14x14/222222/222222.png) `#222222` | ![#1A4FB4](https://placehold.co/14x14/1A4FB4/1A4FB4.png) `#1A4FB4` |
| **Sépia** | ![#FAF7F0](https://placehold.co/14x14/FAF7F0/FAF7F0.png) `#FAF7F0` | ![#342D22](https://placehold.co/14x14/342D22/342D22.png) `#342D22` | ![#7A4B12](https://placehold.co/14x14/7A4B12/7A4B12.png) `#7A4B12` |
| **Escuro** | ![#292A2D](https://placehold.co/14x14/292A2D/292A2D.png) `#292A2D` | ![#D4D4D4](https://placehold.co/14x14/D4D4D4/D4D4D4.png) `#D4D4D4` | ![#8AB4F8](https://placehold.co/14x14/8AB4F8/8AB4F8.png) `#8AB4F8` |
| **Preto** | ![#000000](https://placehold.co/14x14/000000/000000.png) `#000000` | ![#E6E6E6](https://placehold.co/14x14/E6E6E6/E6E6E6.png) `#E6E6E6` | ![#8AB4F8](https://placehold.co/14x14/8AB4F8/8AB4F8.png) `#8AB4F8` |
| **Automático** | Segue o tema do sistema | | |

**Fontes de leitura:** Georgia, Literata, Atkinson Hyperlegible Next e Lexend. As três últimas vêm empacotadas na extensão (OFL), sem chamadas externas.

## 🔐 Privacidade e permissões

- O texto e as preferências são processados localmente, sem conta, servidor ou sincronização.
- A extensão instalada não precisa de variáveis de ambiente nem de chaves.

| Permissão | Para quê |
|---|---|
| `activeTab` · `scripting` | Abrir o leitor na aba atual quando você pede |
| `contextMenus` | Item *Abrir no L’Essentiel* no menu de contexto |
| `storage` | Guardar suas preferências no navegador |
| `file:///*` | Ler páginas e PDFs locais |
| `http://*/*` · `https://*/*` (opcional) | Ativação automática só nos sites que você escolher |

## 🏛️ Arquitetura

```mermaid
flowchart LR
  U([Você]) -->|ícone · atalho · menu| BG[background.ts]
  BG -->|página web| CS[reader.content.ts]
  BG -->|PDF local| PDF[entrypoints/pdf · pdfjs-dist]
  CS --> EX[extract-article<br/>Readability · DOMPurify]
  PDF --> PT[pdf-text]
  EX --> RP[reader-panel<br/>Shadow DOM]
  PT --> RP
  RP --> TB[reader-toolbar<br/>temas · fontes · tamanho]
  TB <--> ST[(storage.local)]
```

<details>
<summary><b>Stack completa</b></summary>

| Camada | Tecnologia |
|---|---|
| Framework de extensão | [WXT](https://wxt.dev) · Manifest V3 |
| Linguagem | TypeScript |
| Extração de artigo | `@mozilla/readability` |
| Sanitização | `dompurify` |
| PDF | `pdfjs-dist` |
| Testes | Vitest · Playwright (aceite e regressão) |
| Lint e formatação | oxlint · oxfmt |

</details>

## 🛠️ Desenvolvimento

**Pré-requisitos:** Node.js e npm.

```bash
git clone https://github.com/BrunodosSantosVaz/lessentiel.git
cd lessentiel
npm ci
npm run dev
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Abre o navegador com a extensão em modo de desenvolvimento |
| `npm run build` | Compila a extensão |
| `npm run package` | Gera o ZIP |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:acceptance` | Testes de aceite e regressão (Playwright) |
| `npm run test:coverage` | Cobertura (mínimo de 80%) |
| `npm run lint` · `npm run typecheck` | Lint, formatação e tipos |

<details>
<summary><b>Perfis de compilação</b></summary>

| Variável | Uso |
|---|---|
| `MLA_FEATURE_READER` | Liga o leitor no build |
| `MLA_TEST_MODE` | Build de teste com permissões para testes headless |
| `BB_RC` | Identifica a candidata na esteira |

Comandos, permissões e verificação dos pacotes: [Wiki → Operação](https://github.com/BrunodosSantosVaz/lessentiel/wiki/Operacao).

</details>

## 🤝 Contribuindo

Encontrou um problema? [Abra uma issue](https://github.com/BrunodosSantosVaz/lessentiel/issues). Dúvidas e ideias vão para as [Discussions](https://github.com/BrunodosSantosVaz/lessentiel/discussions). Acompanhe o [quadro público](https://github.com/users/BrunodosSantosVaz/projects/33) e o [histórico de versões](https://github.com/BrunodosSantosVaz/lessentiel/releases).

Este projeto é construído com o framework [Big Bang](https://github.com/BrunodosSantosVaz/big-bang): uma pessoa decide, IAs executam, e toda mudança passa por uma esteira com testes, revisão e homologação.

1. Trabalhe numa branch a partir de `develop` (bugs a partir de `main`).
2. Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em inglês. Issues, PRs e documentação em português do Brasil.
3. Bug: o primeiro commit traz o teste que falha, a correção vem no segundo.
4. Abra o PR com *O que muda*, *Testes* e *Issue* (`Refs #n`). A CI precisa ficar verde.

Leia o [guia de contribuição](CONTRIBUTING.md), o [`AGENTS.md`](AGENTS.md) e o [código de conduta](CODE_OF_CONDUCT.md).

## 🛡️ Segurança

Não abra issue pública com detalhes de uma vulnerabilidade. Use o [relato privado](https://github.com/BrunodosSantosVaz/lessentiel/security/advisories/new) do GitHub; se ele não estiver disponível, abra uma issue só pedindo contato, sem detalhes. Todo PR passa por varredura de segredos, análise estática, dependências e CodeQL. Veja a [política de segurança](SECURITY.md).

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE). Fontes Literata, Atkinson Hyperlegible Next e Lexend sob OFL. O framework [Big Bang](https://github.com/BrunodosSantosVaz/big-bang) mantém sua [licença própria](.bigbang/LICENSE).

<div align="center">

<br>

<img src="assets/brand/logo.svg" alt="L’Essentiel" width="180">

<sub>Por <a href="https://github.com/BrunodosSantosVaz">Bruno dos Santos Vaz</a></sub>

<br><br>

<a href="https://star-history.com/#BrunodosSantosVaz/lessentiel&Date">
  <img src="https://api.star-history.com/svg?repos=BrunodosSantosVaz/lessentiel&type=Date" alt="Star History" width="560">
</a>

<br>

<sub>Se o L’Essentiel deixa sua leitura mais tranquila, deixe uma ⭐ no repositório.</sub>

</div>
