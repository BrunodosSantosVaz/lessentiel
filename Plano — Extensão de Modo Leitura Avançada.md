# Plano — Extensão de Modo Leitura Avançada

Oct 15, 2026 · @Bruno Vaz

## 1. Visão geral do produto

A extensão transforma qualquer página web ou PDF com texto em uma leitura limpa, em coluna única, com tipografia, tema e rolagem automática controlados por uma barra fixa no topo. O alvo inicial são navegadores Chromium com Manifest V3: Edge e Brave como prioridade, com Chrome, Opera e Vivaldi vindo de graça pelo mesmo código.

**Nome provisório:** Leitor Limpo (definir marca e verificar disponibilidade nas lojas e domínio).

### Problema

- Páginas modernas misturam texto com anúncios, cards, barras laterais, pop-ups e layouts em várias colunas, o que cansa a leitura longa.
- O modo leitura nativo do Edge (Leitor Imersivo) e do Brave (Speedreader) não funciona em todas as páginas, oferece pouco controle e não trata PDFs da mesma forma.
- PDFs acadêmicos e técnicos têm duas colunas, hifenização e cabeçalhos repetidos, o que torna a leitura em tela ruim.

### Objetivos

1. Ativar leitura limpa em 1 clique ou 1 atalho, em menos de 300 ms para uma página típica.
2. Preservar a estrutura que importa: hierarquia de títulos, listas, citações, código e tabelas (grids de dados).
3. Remover tudo que é decoração: cores, cards, imagens, sombras, colunas, anúncios.
4. Dar ao leitor controle simples: 3 fontes, 4 temas, tamanho da fonte e rolagem automática com velocidade.
5. Funcionar 100% localmente, sem enviar conteúdo para servidores.

### Escopo do MVP (versão 1.0)

| Incluído no MVP | Fora do MVP (fases seguintes) |
| --- | --- |
| Ativação por ícone, atalho e menu de contexto | Leitura em voz alta (TTS) |
| Extração com Readability + limpeza própria | OCR para PDF escaneado |
| Coluna única, títulos destacados, tabelas preservadas | Destaques, anotações e exportação |
| 3 fontes, 4 temas, A− / A+, largura do bloco, entrelinha, alinhamento do texto, índice lateral recolhível, tempo de leitura | Sincronização de perfis entre dispositivos além do storage.sync |
| Rolagem automática com play/pausa e velocidade | Firefox e Safari |
| PDF com texto selecionável (PDF.js) | Modo foco por linha, régua de leitura |
| Preferências salvas, idioma pt-BR, en, es | Versão paga e conta de usuário |

## 2. Mercado e concorrentes

O diferencial está em juntar, numa só ferramenta local e gratuita no núcleo, três coisas que hoje vêm separadas: modo leitura que funciona em mais páginas, PDF no mesmo visual e rolagem automática com velocidade. A lista abaixo é de memória e deve ser revalidada nas lojas antes do início do projeto (recursos e preços mudam).

| Concorrente | O que faz bem | Lacuna que você explora |
| --- | --- | --- |
| Leitor Imersivo do Edge (nativo) | Integrado, leitura em voz alta, boa tipografia | Só ativa em páginas que o Edge considera legíveis; pouca personalização; PDF fica de fora |
| Speedreader do Brave (nativo) | Rápido, bloqueia rastreadores | Poucos temas e fontes; sem rolagem automática; não cobre PDF |
| Modo leitura do Chrome (painel lateral) | Funciona em mais páginas | Fica em painel estreito, não substitui a página |
| Extensões tipo "Reader View" (porte do Firefox) | Baseadas em Readability, confiáveis | Interface datada, sem PDF, sem auto-scroll |
| Mercury / Just Read / Clearly-like | Personalização ampla | Muitas opções, curva de aprendizado; algumas exigem conta ou são pagas |
| Dark Reader | Temas escuros em qualquer site | Não limpa layout nem remove colunas |
| Extensões de auto-scroll | Rolagem com velocidade | Rolam a página original, com toda a poluição visual |

### Recursos de destaque do mercado e o que adotar

Os modos leitura nativos e as extensões líderes convergem num conjunto de recursos; a coluna "Adotar" diz em que fase cada um entra neste projeto.

| Recurso | Onde existe hoje | Adotar | Observação |
| --- | --- | --- | --- |
| Tempo estimado de leitura (reloginho) | Firefox Reader View | MVP | Detalhado na seção 4 |
| Largura do conteúdo e entrelinha | Firefox, Leitor Imersivo do Edge | MVP | Já incluídos (RF14, RF15) |
| Alinhamento do texto | Firefox (opções avançadas) | MVP | Já incluído (RF17) |
| Espaçamento entre letras e entre palavras | Firefox, Edge ("espaçamento aumentado") | Fase 2 | Ajuda leitores com dislexia; vai no menu "Mais" |
| Tema automático que segue o sistema | Firefox (Auto) | MVP | Quinta opção no menu, além dos 4 temas |
| Ativar sempre em um site ou em todos | Brave Speedreader | MVP | Já previsto em "sitesAutomaticos"; adicionar opção global |
| Foco de linha (realça 1, 3 ou 5 linhas e escurece o resto) | Leitor Imersivo do Edge | Fase 2 | Combina muito bem com a rolagem automática |
| Esmaecer o texto já lido | Modo leitura do Chrome | Fase 2 | Opção ligada à rolagem automática e à voz |
| Leitura em voz alta com destaque da palavra e controle de velocidade | Edge, Chrome, Firefox | Fase 3 | Usar as vozes do próprio sistema (Web Speech API), sem servidor |
| Divisão em sílabas e classes gramaticais | Leitor Imersivo do Edge | Fase 3 | Exige processamento de linguagem em português; avaliar custo |
| Tradução da página e dicionário de imagens | Leitor Imersivo do Edge | Não no núcleo | Dependem de serviços externos; conflita com a promessa de 100% local |
| Destaques, notas e leitura offline | Extensões como Web Highlights e apps "ler depois" | Fase 3 | Candidato a recurso pago |
| Leitura rápida palavra por palavra (RSVP) | Extensões de speed reading | Fase 3, opcional | Modo alternativo à rolagem automática |
| Negrito no início das palavras ou gradiente de cor por linha | Extensões do tipo Bionic Reading e BeeLine | Avaliar | Verificar marcas registradas e patentes antes de implementar |

O que nenhum dos nativos faz bem, e vira o diferencial: PDF no mesmo leitor, rolagem automática com velocidade, índice lateral e funcionamento em qualquer página com fallback de "selecionar área".

Fontes: [Brave – Speedreader](https://support.brave.app/hc/en-us/articles/360045031392) · [Microsoft Learn – Leitor Imersivo](https://learn.microsoft.com/en-us/training/modules/research-learn-using-microsoft-edge/immersive-reader) · [Mozilla – Reader View](https://support.mozilla.org/kb/firefox-reader-view-distraction-free-web-pages) · [Mozilla – textos da interface do Reader View](https://searchfox.org/mozilla-central/source/toolkit/locales/en-US/toolkit/about/aboutReader.ftl) · [Omnius – leitura em voz alta no Chrome](https://www.omnius.so/industry-updates/chrome-launches-read-aloud-feature-for-free-on-all-pages) · [BleepingComputer – Chrome Read Aloud](https://www.bleepingcomputer.com/news/google/google-chrome-tests-microsoft-edge-like-read-aloud-feature)

### Padrões de mercado a seguir

- **Manifest V3** obrigatório em lojas Chromium; nada de código remoto.
- **Readability.js da Mozilla** como base de extração: é o que a maioria dos modos leitura usa.
- **Barra de controles mínima** com opções avançadas escondidas num menu "mais".
- **Temas em 4 tons** (branco, sépia/claro, escuro, preto) e largura de linha entre 60 e 75 caracteres.
- **Privacidade local** como argumento de venda: "seu texto nunca sai do navegador".

### Posicionamento

Para quem lê textos longos na tela (estudantes, pesquisadores, profissionais, pessoas com baixa visão ou dislexia) e quer um modo leitura que funcione sempre, inclusive em PDF, com controles simples e sem conta.

## 3. Requisitos

Os requisitos abaixo são o contrato do MVP; cada um vira história no backlog com critério de aceite testável.

### Funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF01 | Ativar/desativar o modo leitura | Ícone, atalho (sugestão Alt+Shift+R), menu de contexto; Esc sai e restaura a página intacta |
| RF02 | Extrair o conteúdo principal | Título, autor/data quando houver, corpo; ≥ 90% de acerto no corpus de teste |
| RF03 | Coluna única | Nenhum elemento lado a lado; todo o conteúdo dentro de um bloco único centralizado (largura definida no RF14) |
| RF04 | Hierarquia de títulos visível | H1 a H4 com tamanhos e espaçamentos distintos; títulos pulados são normalizados |
| RF05 | Preservar tabelas | Tabelas de dados mantêm linhas/colunas; tabelas largas rolam na horizontal; tabelas de layout são desmontadas |
| RF06 | Limpeza geral | Remove cores, fundos, cards, sombras, imagens, vídeos, anúncios, botões de compartilhar, comentários |
| RF07 | 3 fontes | Troca instantânea, com prévia no seletor |
| RF08 | 4 temas | Preto, Escuro, Claro (sépia), Branco; troca sem recarregar |
| RF09 | Tamanho da fonte | A− / A+ em passos de 2 px, de 14 a 32 px; padrão 20 px |
| RF10 | Rolagem automática | Play/pausa e controle de velocidade; pausa ao interagir |
| RF11 | PDF | Abrir PDF com texto no mesmo leitor, mesma barra e temas |
| RF12 | Preferências | Fonte, tema, tamanho, largura, entrelinha, alinhamento, índice aberto/fechado e velocidade lembrados entre sessões |
| RF13 | Fallback | Se a extração falhar, avisar e oferecer "selecionar área" ou "usar página inteira" |
| RF14 | Largura do bloco | − / + de 50% a 100% da largura da janela, em passos de 5%; o bloco inteiro fica sempre centralizado na horizontal, e o texto dentro dele segue o alinhamento escolhido (RF17) |
| RF15 | Espaçamento entre linhas (entrelinha) | − / + de 1,2 a 2,4 em passos de 0,1; padrão 1,6; espaço entre parágrafos acompanha proporcionalmente |
| RF16 | Índice lateral | Gerado automaticamente a partir dos títulos quando o texto tiver 3 ou mais; painel à esquerda, estilo painel de navegação do Word, que se recolhe e expande; clique leva à seção; seção atual destacada |
| RF17 | Alinhamento do texto | Esquerda (padrão), centralizado ou justificado; troca instantânea; tabelas, listas e código continuam alinhados à esquerda |
| RF18 | Tempo de leitura | Ícone de relógio com o tempo total abaixo do título ("⏱ 8 min de leitura") e tempo restante atualizado durante a leitura |

### Não funcionais

| Área | Meta |
| --- | --- |
| Desempenho | Ativação < 300 ms em página típica; < 1 s em páginas de 10 mil palavras; rolagem a 60 fps |
| Tamanho | Pacote < 1,5 MB sem fontes; fontes em WOFF2 com subset latino (\~200–400 KB no total) |
| Memória | Sem vazamento ao ativar/desativar 50 vezes seguidas |
| Acessibilidade | WCAG 2.2 AA em todos os temas (contraste ≥ 4,5:1, meta 7:1); 100% operável por teclado; leitores de tela |
| Privacidade | Nenhum dado enviado; sem analytics por padrão; permissões mínimas |
| Compatibilidade | Edge, Brave e Chrome nas 2 últimas versões estáveis; Windows, macOS, Linux |
| Isolamento | O CSS da página não afeta o leitor e vice-versa (Shadow DOM) |
| Internacionalização | pt-BR, en, es no lançamento; suporte a idiomas RTL planejado |

## 4. UX/UI

A experiência gira em torno de uma única barra no topo, com 8 grupos de controle e nada mais visível; tudo que é avançado fica no menu "Mais". O leitor deve sentir que a página "respirou" no instante em que clicou.

&#91;embedded content: barra superior e página do leitor · esboço\]

Da esquerda para a direita: sair, índice, fonte, tema, tamanho, largura do bloco, entrelinha, rolagem automática e menu; a linha colorida na borda inferior da barra é o progresso de leitura.

### Personas

| Persona | Necessidade principal | Impacto no design |
| --- | --- | --- |
| Estudante / pesquisador | Ler artigos e PDFs longos | PDF de primeira classe, tempo estimado, rolagem automática |
| Profissional que lê notícias e relatórios | Rapidez, sem distração | Ativação em 1 atalho, lembrar preferências |
| Pessoa com baixa visão | Letras grandes e alto contraste | Fonte até 32 px, tema Preto, Atkinson Hyperlegible |
| Pessoa com dislexia ou TDAH | Texto estável, linhas curtas, menos estímulo | Lexend, coluna estreita, entrelinha generosa, sem imagens |

### Princípios de design

1. **Conteúdo primeiro:** a barra ocupa no máximo 52 px e se esconde ao rolar para baixo; volta ao rolar para cima ou ao passar o mouse no topo.
2. **Zero configuração:** abre com padrões bons (Literata, tema Claro, 20 px, largura automática, entrelinha 1,6); quem quiser ajusta.
3. **Reversível:** Esc ou "Sair" devolve a página exatamente como estava, na mesma posição.
4. **Consistência web/PDF:** a mesma barra, os mesmos temas, o mesmo comportamento.
5. **Feedback imediato:** toda troca de fonte, tema ou tamanho é aplicada sem recarregar, com transição de no máximo 150 ms.

### Fluxos principais

1. **Ativar:** clicar no ícone, atalho Alt+Shift+R (configurável em `edge://extensions/shortcuts`) ou clique direito → "Abrir no modo leitura". O ícone mostra um selo quando a página parece legível.
2. **Ler:** a página aparece em coluna única; a barra fica visível por 2 s e depois se recolhe.
3. **Ajustar:** trocar fonte, tema, tamanho, largura do bloco e entrelinha; a escolha vira o novo padrão global (com opção de salvar só para o site no menu "Mais").
4. **Rolar sozinho:** Play, ajustar velocidade, pausar ao tocar.
5. **Sair:** Esc, botão Sair ou clicar no ícone de novo.
6. **Falha:** se não houver conteúdo legível, mostrar mensagem curta com "selecionar área" e "usar página inteira".

### As 3 fontes escolhidas

Todas são gratuitas (SIL Open Font License), têm acentos completos do português e versões variáveis em WOFF2.

| Fonte | Estilo | Por que foi escolhida | Para quem |
| --- | --- | --- | --- |
| Literata | Serifada | Projetada pelo Google para leitura longa em tela (Google Play Livros); serifas suaves que não "piscam" em telas de baixa resolução | Padrão; leitura longa, livros, artigos |
| Atkinson Hyperlegible Next | Sem serifa | Criada pelo Braille Institute para máxima distinção entre letras parecidas (I, l, 1; O, 0) | Baixa visão, telas pequenas, textos técnicos |
| Lexend | Sem serifa | Desenhada para fluidez de leitura, com espaçamento mais aberto; popular entre leitores com dislexia | Dislexia, TDAH, leitura cansada |

Código usa a fonte monoespaçada do sistema (`ui-monospace`), sem pacote extra. Alternativas se quiser trocar alguma: Source Serif 4, Merriweather, Inter, OpenDyslexic.

### Os 4 temas

Os valores abaixo são o ponto de partida; validar o contraste com uma ferramenta (meta: ≥ 7:1 no corpo do texto).

| Tema | Fundo | Texto | Títulos | Links | Contraste aprox. |
| --- | --- | --- | --- | --- | --- |
| Preto | #000000 | #E6E6E6 | #FFFFFF | #8AB4F8 | \~16:1 |
| Escuro | #1E1F22 | #D4D4D4 | #F2F2F2 | #8AB4F8 | \~11:1 |
| Claro (sépia) | #F4ECD8 | #3A3226 | #1F1A12 | #6B4E16 | \~11:1 |
| Branco | #FFFFFF | #1A1A1A | #000000 | #1A56C4 | \~17:1 |

No tema Preto, texto branco puro (#FFFFFF) sobre preto puro causa "halo" em muita gente; por isso o corpo usa um branco levemente mais suave, e os títulos ficam em branco puro para se destacar.

### Regras de tipografia

- Bloco de conteúdo centralizado na horizontal, com largura controlada pelo usuário (detalhes abaixo); margem lateral mínima de 16 px no celular e 24 px no desktop, mesmo em 100%.
- Entrelinha padrão 1,6 no corpo (ajustável) e 1,25 nos títulos; espaço entre parágrafos de 0,6 × a entrelinha.
- Escala de títulos: H1 2,0 em · H2 1,5 em · H3 1,25 em · H4 1,1 em; todos em negrito, com mais espaço acima do que abaixo, para ficar claro a que bloco pertencem.
- Alinhamento configurável (esquerda, centralizado ou justificado; padrão esquerda, detalhes abaixo). No justificado, evitar os "rios" de espaço com hifenização automática pelo idioma.
- Tabelas com linhas finas, cabeçalho em negrito com fundo levemente diferente, números alinhados à direita e rolagem horizontal quando passarem do bloco.

### Largura do bloco e entrelinha

Os dois controles ficam na barra, ao lado do tamanho da fonte, cada um com − / + e o valor atual visível.

| Controle | Faixa | Passo | Padrão | Comportamento |
| --- | --- | --- | --- | --- |
| Largura do bloco | 50% a 100% da janela | 5% | Automático: o menor valor que dá \~70 caracteres por linha (em monitor grande fica perto de 50%, no notebook 60–75%, no celular 100%) | O bloco inteiro (título, texto, tabelas) fica centralizado; só ele muda de largura, o texto dentro dele segue o alinhamento escolhido |
| Entrelinha | 1,2 a 2,4 | 0,1 | 1,6 | Aproxima ou afasta as linhas do corpo; o espaço entre parágrafos e acima dos títulos acompanha na mesma proporção |

Regras de comportamento:

- A largura é calculada sobre a área útil da janela (descontando a barra de rolagem), e o bloco nunca fica menor que 320 px, para não esmagar o texto em janelas estreitas.
- Ao mudar largura, entrelinha ou tamanho, o leitor mantém o parágrafo que estava no topo da tela como âncora, para o usuário não "perder o lugar".
- Se a combinação largura + tamanho passar de \~100 caracteres por linha, mostrar uma vez uma dica discreta ("linhas muito longas cansam a leitura"), sem bloquear a escolha.
- Ao chegar em 50% ou 100% (ou 1,2 e 2,4), o botão correspondente fica desabilitado e o leitor de tela anuncia o limite.
- Transição de largura e entrelinha em até 150 ms; sem animação se `prefers-reduced-motion` estiver ativo.
- Em janelas com menos de \~900 px, a barra não cabe em uma linha: largura e entrelinha são os primeiros controles a ir para o menu "Mais" (no celular a largura já é 100%), depois a fonte.

### Alinhamento do texto

O alinhamento é configurável, com três opções no menu "Mais" (ícones de alinhamento, como num editor de texto) e no atalho A, que alterna entre elas.

| Opção | Como fica | Cuidados de implementação |
| --- | --- | --- |
| Esquerda (padrão) | Margem esquerda reta, direita irregular | É a opção mais confortável para leitura longa em tela |
| Centralizado | Cada linha centralizada no bloco, títulos também | Bom para textos curtos; em textos longos, mostrar uma vez a dica de que cansa mais |
| Justificado | Margens esquerda e direita retas, como em livro | Ativar hifenização automática pelo idioma (`hyphens:auto`) e `text-justify:inter-word` para reduzir os "rios" de espaço; a última linha do parágrafo fica à esquerda |

Em todos os casos, tabelas, listas, blocos de código e citações longas ficam alinhados à esquerda, porque centralizar ou justificar esses elementos atrapalha a leitura.

### Tempo de leitura (reloginho)

Abaixo do título aparece um ícone de relógio com o tempo estimado, no formato "⏱ 8 min de leitura", como nos modos leitura do Firefox e de outros navegadores.

| Aspecto | Comportamento |
| --- | --- |
| Cálculo | Palavras do corpo ÷ velocidade de leitura; padrão 220 palavras por minuto para português; arredondado para cima, mínimo "1 min" |
| O que conta | Só o texto extraído (sem menus nem elementos removidos); tabelas e código contam com peso menor |
| Faixa | Textos longos mostram faixa: "⏱ 12–15 min", usando 200 e 250 ppm |
| Tempo restante | Ao rolar, o texto passa a "faltam 5 min"; a barra de progresso na borda da barra mostra o mesmo ao passar o mouse |
| Com rolagem automática | O tempo restante usa a velocidade escolhida no controle, não a média |
| Ritmo pessoal (fase 2) | Opcional: aprender a velocidade real do usuário a partir do tempo gasto nos textos lidos até o fim, guardada só no navegador |
| Índice lateral | Cada seção pode mostrar seu tempo à direita ("3 min"), em cinza discreto (fase 2) |
| PDF | Mesmo cálculo; em PDFs grandes, o número aparece assim que todas as páginas forem processadas |

### Índice lateral (painel de navegação)

O leitor monta um índice próprio a partir dos títulos extraídos e o mostra num painel à esquerda, como o painel de navegação do Word. Ele aparece mesmo quando a página original não tem índice; se a página tiver um índice próprio, ele é removido na limpeza e substituído por este, para o visual ser sempre o mesmo.

| Aspecto | Comportamento |
| --- | --- |
| Quando aparece | Texto com 3 ou mais títulos (H2 a H4); com menos, o botão fica desabilitado com a dica "sem seções neste texto" |
| Conteúdo | Título do artigo no topo; H2 como itens principais, H3 recuados abaixo, H4 opcional (configurável) |
| Recolher / expandir o painel | Botão na barra (☰) e botão « no próprio painel; atalho I; o estado fica salvo |
| Recolher / expandir seções | Seta ao lado de cada H2 que tem subtítulos, como uma árvore |
| Navegação | Clique rola suavemente até a seção, com o título no topo da tela; se a rolagem automática estiver ligada, ela continua dali |
| Seção atual | Item destacado com uma barra lateral colorida enquanto você lê, e o painel rola sozinho para manter esse item visível |
| Títulos longos | Uma linha com reticências; o título completo aparece ao passar o mouse |
| Largura do painel | 260 px padrão, arrastável entre 200 e 400 px (fase 2) |
| Espaço do texto | Em telas largas, o painel empurra o conteúdo e o bloco se centraliza no espaço que sobra; a % de largura passa a valer sobre essa área |
| Telas estreitas | Abaixo de \~1000 px, o painel vira gaveta sobreposta que fecha ao escolher um item |
| Estado inicial | Aberto em telas largas quando houver índice; fechado em telas estreitas; depois vale a última escolha do usuário |
| PDF | Usa os marcadores (bookmarks) do próprio PDF quando existirem; senão, os títulos detectados pela reconstrução de layout |
| Temas | O painel segue o tema escolhido, com fundo levemente diferente do bloco de texto para separar as áreas |

Acessibilidade: o painel é um `<nav aria-label="Índice">` com lista em árvore navegável por setas, o item atual marcado com `aria-current`, e foco devolvido ao título da seção ao clicar.

### Acessibilidade e teclado

| Atalho | Ação |
| --- | --- |
| Alt+Shift+R | Abrir/fechar modo leitura |
| Esc | Sair |
| Espaço | Play/pausa da rolagem |
| ↑ / ↓ (durante a rolagem) | Mais rápido / mais devagar |
| Ctrl + / Ctrl − | Aumentar / diminuir fonte (dentro do leitor) |
| \[ / \] | Diminuir / aumentar a largura do bloco |
| Alt+↑ / Alt+↓ | Aumentar / diminuir a entrelinha |
| A | Alternar alinhamento (esquerda → centralizado → justificado) |
| I | Mostrar / recolher o índice lateral |
| N / P | Próxima / anterior seção do índice |
| T | Próximo tema |
| F | Próxima fonte |

- A barra é um `role="toolbar"` com navegação por setas; cada botão tem rótulo para leitor de tela e estado anunciado ("tema Escuro selecionado").
- Foco sempre visível, alvos de clique com pelo menos 24 × 24 px (WCAG 2.2).
- Respeitar `prefers-color-scheme` para sugerir o tema inicial e `prefers-reduced-motion` para animações.

### Outras telas

- **Popup do ícone:** botão grande "Ler esta página", atalho visível, link para opções.
- **Página de opções:** padrões globais, lista de sites com ativação automática, atalhos, idioma, sobre/licenças.
- **Onboarding:** página única após instalar, com 3 passos ilustrados e um texto de exemplo para testar os controles.
- **Estados de erro:** "não encontramos texto aqui", "PDF sem texto selecionável", "permissão necessária para abrir este PDF".

## 5. Stack tecnológica e linguagens

Recomendação: TypeScript em tudo, com o framework WXT para empacotar a extensão e Preact (ou Svelte) para a interface dentro de Shadow DOM. Confirme versões e manutenção ativa de cada biblioteca no início do projeto.

| Camada | Escolha recomendada | Alternativa | Por quê |
| --- | --- | --- | --- |
| Linguagem | TypeScript (strict) | JavaScript puro | Tipagem evita erros na troca de mensagens entre contextos |
| Framework de extensão | WXT (baseado em Vite) | Plasmo, CRXJS + Vite | Gera manifest, HMR em dev, builds por navegador, zips para as lojas |
| UI da barra e do leitor | Preact + CSS próprio | Svelte, Web Components puros | \~4 KB, rápido para injetar em qualquer página |
| Estilo | CSS com variáveis (custom properties) | Tailwind | Temas viram troca de 6–8 variáveis; nada vaza para a página |
| Extração HTML | @mozilla/readability | Postlight Parser | Padrão de mercado, mantido pela Mozilla, licença Apache 2.0 |
| Sanitização | DOMPurify | Sanitizer API nativa | Remove scripts e atributos perigosos antes de renderizar |
| PDF | PDF.js (pdfjs-dist) | — | Único leitor maduro em JS; usado pelo Firefox |
| OCR (fase 3) | Tesseract.js (WASM) | — | Roda local, sem servidor |
| Estado/preferências | chrome.storage.sync + local | IndexedDB | Sincroniza preferências pela conta do navegador |
| Testes unitários | Vitest | Jest | Integrado ao Vite |
| Testes E2E | Playwright com extensão carregada | Puppeteer | Carrega extensões descompactadas em Chromium |
| Qualidade | ESLint, Prettier, axe-core | Biome | Lint, formatação e auditoria de acessibilidade |
| CI/CD | GitHub Actions | GitLab CI | Build, testes e geração dos .zip a cada tag |
| Fontes | Arquivos WOFF2 empacotados | Google Fonts via CDN | MV3 e privacidade: sem requisição externa |

### Licenças a respeitar

- Readability (Apache 2.0), DOMPurify (Apache 2.0 / MPL 2.0), PDF.js (Apache 2.0), fontes (SIL Open Font License 1.1).
- Incluir um arquivo de licenças de terceiros dentro do pacote e na página da loja.

## 6. Arquitetura (Manifest V3)

A arquitetura separa "de onde vem o texto" (página HTML ou PDF) de "como ele é exibido" (um único núcleo de leitor reutilizado). Assim, toda melhoria de UI vale para os dois casos, e o motor de extração pode evoluir sem mexer na interface.

&#91;embedded content: arquitetura Manifest V3 · 6 componentes\]

O service worker decide o caminho; os dois leitores destacados são o mesmo código, e ambos leem e gravam preferências no chrome.storage.

### Decisões de arquitetura

| Decisão | Escolha | Motivo |
| --- | --- | --- |
| Onde mostrar o leitor HTML | Sobreposição (overlay) em tela cheia na própria aba, dentro de Shadow DOM fechado | Mantém URL, histórico e login; sair é instantâneo; CSS da página não interfere |
| Onde mostrar o PDF | Página própria da extensão (`reader.html`) | O visualizador nativo não aceita scripts de extensão |
| Injeção | Sob demanda via `chrome.scripting` + `activeTab` | Sem script rodando em todas as páginas: mais leve e mais fácil de aprovar nas lojas |
| Página original | Escondida (não removida) e scroll travado enquanto o leitor está aberto | Restauração perfeita ao sair |
| Comunicação | Mensagens tipadas (`runtime.sendMessage` / `tabs.sendMessage`) com um contrato único em TypeScript | Evita erros entre contextos |
| Estado | Preferências no `storage.sync`; estado de sessão (posição, rolagem) em memória | Sincroniza entre dispositivos sem servidor próprio |
| Fontes | Arquivos WOFF2 em `web_accessible_resources`, carregados via `FontFace` dentro do Shadow DOM | Funciona mesmo em sites com CSP rígida |
| Trabalho pesado | PDF.js e análise de layout em Web Worker | A interface não trava em PDFs grandes |

### Organização do código (módulos)

- **core/extraction** – Readability, sanitização, normalização de títulos, classificação de tabelas.
- **core/pdf** – carregamento PDF.js, reconstrução de colunas, parágrafos, cabeçalhos e rodapés.
- **core/reader-ui** – barra, renderizador, temas (variáveis CSS), fontes, controle de tamanho, alinhamento, índice lateral.
- **core/autoscroll** – motor de rolagem e conversão ppm → px/s.
- **core/settings** – esquema de preferências, valores padrão, migrações entre versões.
- **entrypoints** – service worker, content script, reader.html, popup, opções, onboarding.
- **assets** – fontes WOFF2, ícones (16, 32, 48, 128 px), traduções em `_locales`.
- **tests** – unitários, corpus de páginas/PDFs, E2E.

### Esquema de preferências (rascunho)

| Chave | Tipo | Padrão |
| --- | --- | --- |
| fonte | literata · atkinson · lexend | literata |
| tema | preto · escuro · claro · branco · automático | claro (ou escuro se o sistema estiver escuro) |
| tamanhoFonte | 14–32 px | 20 |
| larguraBloco | automático ou 50–100% (passos de 5%) | automático (\~70 caracteres por linha) |
| entrelinha | 1,2–2,4 (passos de 0,1) | 1,6 |
| alinhamento | esquerda · centralizado · justificado | esquerda |
| indiceAberto | automático · sim · não | automático (aberto em telas largas) |
| indiceNiveis | H2–H3 · H2–H4 | H2–H3 |
| mostrarTempoLeitura | sim · não | sim |
| ppmLeitura | 120–400 palavras por minuto | 220 |
| velocidade | 1–10 | 4 |
| ativarSempre | nunca · sites escolhidos · todos os sites | nunca |
| sitesAutomaticos | lista de domínios | vazia |
| versaoEsquema | número | 1 |

## 7. Motor de extração e limpeza

O motor é o coração do produto: Readability encontra o conteúdo, e um pipeline próprio de pós-processamento garante coluna única, títulos claros e tabelas preservadas. Ele roda sobre um clone do DOM, nunca sobre a página original.

### Pipeline

1. **Pré-checagem:** contar palavras visíveis e verificar `isProbablyReaderable`; se a página tiver pouco texto, avisar em vez de abrir um leitor vazio.
2. **Clonar** o documento (`document.cloneNode(true)`), incluindo conteúdo de Shadow DOM aberto e iframes de mesma origem quando possível.
3. **Expandir conteúdo oculto:** forçar imagens/textos lazy, abrir `<details>`, ignorar elementos com `display:none` real.
4. **Readability.parse()** para obter título, autor, data, idioma e HTML do corpo.
5. **Sanitizar** com DOMPurify em lista branca: `p, h1–h6, ul, ol, li, blockquote, pre, code, table, thead, tbody, tr, th, td, caption, a, em, strong, sup, sub, br, hr, figure>figcaption`.
6. **Limpar estilo:** remover todos os atributos `style`, `class`, `id`, `bgcolor`, `color`, `width`; remover `img, picture, svg, video, iframe, canvas, button, form, aside, nav`.
7. **Normalizar títulos:** garantir um único H1 (o título do artigo); rebaixar ou subir níveis pulados (H2 → H4 vira H2 → H3); transformar parágrafos curtos em negrito isolado, seguidos de texto, em títulos quando o padrão se repetir.
8. **Classificar tabelas:** tabela de dados (tem `th`, mais de 1 coluna com texto, sem tabelas aninhadas) é mantida; tabela de layout (uma célula com tudo, tabelas aninhadas, células com blocos inteiros) é desmontada em parágrafos.
9. **Achatar grids CSS:** como só o HTML semântico passa pela lista branca, qualquer `display:grid/flex` desaparece e tudo fica em fluxo vertical.
10. **Tipografia final:** juntar parágrafos quebrados, remover linhas vazias repetidas, aplicar `hyphens:auto` com o `lang` detectado.
11. **Renderizar** no Shadow DOM do leitor, gerar o índice a partir dos títulos normalizados (cada título recebe uma âncora) e calcular tempo estimado de leitura (≈ 200–230 palavras por minuto).

### O que fazer com "grids"

Sua especificação diz "se tiver grid ele respeita". A interpretação proposta: grids **de dados** (tabelas) são respeitados com linhas e colunas; grids **de layout** (cards lado a lado, galerias) são convertidos em fluxo de coluna única. Validar essa interpretação antes de começar.

### Casos difíceis

| Caso | Estratégia |
| --- | --- |
| SPA (React, Vue) com conteúdo carregado depois | Aguardar estabilidade do DOM (MutationObserver com debounce de \~500 ms) e oferecer botão "recarregar conteúdo" |
| Páginas com rolagem infinita | Extrair o que está carregado; aviso discreto no fim |
| Fóruns e comentários | Fase 2: modo "discussão" com threads simplificadas |
| Documentação técnica | Preservar `pre/code` com fonte monoespaçada e rolagem horizontal |
| Readability falha | Heurística própria de densidade de texto; depois, modo "selecionar área" com clique |
| Paywalls | Respeitar: só se lê o que já está visível ao usuário |
| Fórmulas (MathML/KaTeX) | Fase 2: lista branca de MathML |

### Melhoria contínua

Manter um corpus de 150–300 páginas reais (notícias, blogs, Wikipedia, documentação, gov.br, e-commerce, fóruns) com o resultado esperado salvo. Toda mudança no motor roda contra esse corpus em CI e mostra a diferença.

## 8. Suporte a PDF

O visualizador de PDF embutido do Edge, Brave e Chrome não aceita scripts de extensões, então a extensão precisa abrir o PDF na sua própria página de leitor, usando PDF.js para extrair o texto e reconstruir parágrafos e títulos. Este é o ponto tecnicamente mais arriscado do projeto.

### Fluxo

1. Usuário clica no ícone com um PDF aberto (URL termina em `.pdf`, ou o tipo do documento é `application/pdf`).
2. A extensão pede permissão opcional para aquele site, se ainda não tiver, e abre `reader.html?src=<url>` em nova aba ou na mesma.
3. A página do leitor baixa o arquivo (ou recebe via arraste/abrir arquivo) e passa para o PDF.js num Web Worker.
4. Para cada página, `getTextContent()` retorna itens com texto, posição, fonte e tamanho.
5. Um reconstrutor de layout transforma os itens em blocos semânticos (abaixo) e entrega HTML ao mesmo renderizador das páginas web.

### Reconstrução de layout

| Problema | Heurística |
| --- | --- |
| Ordem de leitura em 2 colunas | Agrupar itens por coordenada X; detectar o "vão" vertical central; ler coluna esquerda e depois direita |
| Títulos | Tamanho de fonte acima da mediana do corpo + negrito + linha curta → H2/H3 por faixa de tamanho; usar os marcadores (outline) do PDF quando existirem |
| Parágrafos | Juntar linhas com espaçamento normal; quebra quando o espaço vertical passa de \~1,5× a entrelinha ou há recuo |
| Hifenização | Juntar "pala- vra" no fim de linha quando a junção forma palavra conhecida |
| Cabeçalho e rodapé | Remover linhas repetidas em ≥ 60% das páginas na mesma posição (títulos de periódico, números de página) |
| Notas de rodapé | Fonte menor no fim da página → bloco de notas no fim da seção |
| Tabelas | Difícil em PDF: no MVP, manter como texto pré-formatado; fase 3, detecção por alinhamento |
| PDF escaneado (sem texto) | Detectar ausência de texto e oferecer OCR na fase 3 |

### Detalhes práticos

- **Arquivos locais (`file://`)**: o usuário precisa ativar "Permitir acesso a URLs de arquivos" na página da extensão; a interface deve explicar isso com um passo a passo.
- **PDFs grandes**: processar páginas sob demanda (renderiza as primeiras 5 e continua em segundo plano), com barra de progresso.
- **Botão "ver original"**: sempre disponível para voltar ao PDF com imagens e gráficos.
- **PDF protegido por senha**: PDF.js pede a senha; nada é armazenado.

## 9. Rolagem automática

A rolagem deve ser suave, previsível e expressa numa unidade que faça sentido para o leitor: o controle de velocidade mostra "palavras por minuto" aproximadas, e por baixo o motor converte isso em pixels por segundo de acordo com o tamanho da fonte e a largura da coluna.

### Comportamento

- **Play/Pausa** no botão, na barra de espaço e num clique no texto (opcional).
- **Velocidade** em controle deslizante de 1 a 10 (ou 100 a 500 ppm), com ajuste fino pelas teclas ↑ e ↓ enquanto toca.
- **Pausa automática** ao rolar com a roda, tocar na tela, selecionar texto ou trocar de aba; retoma com Play.
- **Fim do texto**: para sozinho e mostra "Fim da leitura" com o tempo total.
- **Contagem de 3 segundos** opcional antes de começar, para o leitor se posicionar.
- **Reduzir movimento**: se o sistema tiver `prefers-reduced-motion`, avisar e usar rolagem por "tela a tela" com intervalo em vez de movimento contínuo.

### Implementação (sem código, só decisões)

- Loop com `requestAnimationFrame`, usando o tempo decorrido entre quadros para a velocidade não depender da taxa de atualização (60, 120 ou 144 Hz).
- Acumular frações de pixel e aplicar só a parte inteira, para não ficar "travando" em velocidades baixas.
- Recalcular a conversão ppm → px/s quando fonte, tamanho, largura do bloco ou entrelinha mudarem, mantendo a posição relativa de leitura (âncora no parágrafo visível).
- Parar o loop quando a aba fica oculta (`visibilitychange`) para não gastar bateria.
- Barra fina de progresso no topo mostrando a porcentagem lida e o tempo restante.

## 10. Permissões, privacidade e segurança

A regra é pedir o mínimo na instalação e o resto só quando o usuário precisar. Extensões que pedem "ler e alterar todos os dados de todos os sites" logo de cara assustam o usuário e passam por revisão mais demorada nas lojas.

| Permissão | Quando | Para quê |
| --- | --- | --- |
| `activeTab` | Instalação | Acesso só à aba atual, só depois de um clique ou atalho |
| `scripting` | Instalação | Injetar o leitor sob demanda |
| `storage` | Instalação | Salvar preferências |
| `contextMenus` | Instalação | "Abrir no modo leitura" no clique direito |
| `host_permissions` opcionais (por site ou `<all_urls>`) | Sob demanda | Baixar PDFs e ativar automaticamente em sites escolhidos |
| Acesso a URLs de arquivo | Ativação manual pelo usuário | Ler PDFs locais |

### Privacidade

- Nenhum conteúdo lido sai do navegador; todo o processamento é local.
- Sem telemetria por padrão. Se houver, só opt-in, anônima, sem URLs, e declarada no formulário de privacidade das lojas.
- Política de privacidade publicada (exigência das lojas), em linguagem simples.

### Segurança

- Todo HTML extraído passa por DOMPurify antes de ser exibido; scripts e handlers (`onclick` etc.) nunca são copiados.
- Links do leitor abrem com `rel="noopener noreferrer"`.
- Nenhum código remoto (proibido no MV3); todas as bibliotecas e fontes vão no pacote.
- Content Security Policy restrita nas páginas da extensão (`script-src 'self'`).
- Mensagens entre content script e service worker validadas por tipo; nunca executar comandos vindos da página.
- Dependências auditadas em CI (npm audit ou equivalente) e travadas por lockfile.

## 11. Testes, qualidade e performance

A qualidade do produto é medida principalmente pelo acerto da extração, então o investimento maior em testes vai para o corpus de páginas e PDFs reais.

| Tipo | Ferramenta | O que cobre |
| --- | --- | --- |
| Unitário | Vitest + jsdom | Normalização de títulos, geração do índice, classificação de tabelas, conversão ppm → px/s, reconstrução de PDF |
| Corpus de extração | Script próprio + snapshots | 150–300 páginas e 50–100 PDFs salvos localmente; compara o resultado com o esperado |
| E2E | Playwright com a extensão carregada | Ativar, trocar tema/fonte/tamanho, rolar, sair e verificar que a página voltou intacta |
| Visual | Capturas do Playwright | Cada tema × cada fonte, nos extremos de largura (50% e 100%) e de entrelinha (1,2 e 2,4), nos 3 alinhamentos e com o índice aberto e fechado, para detectar regressões de layout |
| Acessibilidade | axe-core + teste manual com NVDA e Narrador | Contraste, rótulos, ordem de foco, anúncios de estado |
| Performance | Chrome DevTools, Performance API | Tempo de ativação, quadros perdidos na rolagem, memória após 50 ciclos |
| Navegadores | Matriz manual antes de cada versão | Edge, Brave (escudos ligados e desligados), Chrome; Windows e macOS |

### Métricas de qualidade

- Taxa de extração correta no corpus ≥ 90% no MVP, ≥ 95% na versão 1.x.
- Tempo de ativação p95 < 300 ms em notebook médio.
- 0 erros críticos do axe em todos os temas.
- Avaliação nas lojas ≥ 4,5 após 100 avaliações.

### Brave em especial

Os escudos do Brave bloqueiam elementos e scripts da página; testar se o leitor funciona com escudos agressivos e se o Speedreader nativo ativo não conflita com a extensão.

## 12. Publicação, monetização e roadmap

Com um desenvolvedor experiente em tempo integral, o MVP fica pronto em cerca de 3 meses; os prazos são estimativas e dependem principalmente da qualidade do PDF. Cada fase só avança quando o portão anterior é cumprido.

&#91;embedded content: roadmap · 4 fases, 3 portões\]

A fase de MVP concentra o esforço; leitura em voz alta, OCR e Firefox ficam para depois do lançamento.

### Publicação nas lojas

| Loja | Navegadores atendidos | Observações |
| --- | --- | --- |
| Microsoft Edge Add-ons (Partner Center) | Edge | Prioridade 1; conta de desenvolvedor Microsoft |
| Chrome Web Store | Brave, Chrome, Opera, Vivaldi | Brave instala direto da Chrome Web Store; taxa única de registro (confirmar valor atual) |

- **Materiais da loja:** ícone 128 px, 3–5 capturas 1280 × 800 (um tema em cada), imagem promocional, descrição em pt-BR e en, vídeo curto opcional.
- **Formulário de privacidade:** declarar que não coleta dados e justificar cada permissão em uma frase.
- **Revisão:** pode levar de horas a semanas; permissões amplas aumentam o prazo, por isso o `activeTab`.
- **Atualizações:** versionamento semântico, changelog visível, migração automática de preferências.

### Monetização (opções)

| Modelo | Prós | Contras |
| --- | --- | --- |
| Gratuito e código aberto + doações | Confiança máxima, contribuições da comunidade | Receita baixa e incerta |
| Freemium (núcleo grátis, "Pro" pago) | Receita recorrente; Pro pode ter vozes naturais, anotações, perfis por site | Exige pagamento, licença e suporte |
| Pago único | Simples | Difícil competir com modos leitura nativos gratuitos |

Recomendação: lançar gratuito para ganhar avaliações e base de usuários; decidir o Pro com dados de uso da fase 3. Nunca exibir anúncios dentro do leitor.

### Equipe e esforço estimado

| Papel | Dedicação no MVP |
| --- | --- |
| Desenvolvedor(a) front-end / extensões | Tempo integral |
| Designer UX/UI | \~2–3 semanas (barra, temas, onboarding, loja) |
| Testes com usuários (incluindo pessoas com baixa visão e dislexia) | 5–8 sessões na fase 2 |

### Métricas de sucesso após o lançamento

- Usuários ativos semanais e retenção em 30 dias (dados agregados das lojas, sem telemetria própria).
- Avaliação média e principais reclamações nas resenhas.
- Páginas reportadas como "não funcionou", quando o usuário optar por reportar.

## 13. Riscos e decisões em aberto

O maior risco é a qualidade da extração (web e PDF); o resto é engenharia conhecida.

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Extração falha em sites populares | Alto: avaliações ruins | Corpus em CI, fallback "selecionar área", botão "reportar página" (só a URL, com consentimento) |
| PDFs em 2 colunas saem embaralhados | Alto | Heurística de colunas testada com artigos reais; botão "ver original" sempre visível |
| Mudança de política das lojas | Médio | Permissões mínimas, sem código remoto, política de privacidade clara |
| Conflito com Leitor Imersivo / Speedreader | Baixo | Não interferir; documentar no FAQ |
| CSS da página quebrando o leitor | Médio | Shadow DOM fechado + reset completo de estilos |
| Sites com CSP muito restrita | Baixo | Fontes e estilos injetados via `adoptedStyleSheets` e arquivos `web_accessible_resources` |
| Escopo crescer demais | Médio | MVP congelado; novas ideias vão para o backlog das fases 2 e 3 |

### Decisões que dependem de você

- [ ] Confirmar a leitura de "grid": tabelas de dados preservadas, grids de layout achatados.
- [ ] Tom do tema "Preto": branco puro (#FFFFFF) ou branco suave (#E6E6E6) — o suave cansa menos a vista em fundo preto.
- [ ] Imagens: remover sempre, ou permitir "mostrar imagens" como opção (padrão desligado)?
- [ ] Leitor sobre a página (overlay) para HTML — recomendado — ou sempre em aba própria?
- [ ] Nome e identidade visual da extensão.
- [ ] Modelo de negócio: gratuito e código aberto, ou núcleo gratuito com recursos pagos.
- [ ] Idiomas do lançamento além de pt-BR.
