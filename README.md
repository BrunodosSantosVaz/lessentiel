# Leitor Limpo

Extensão local para ler artigos longos de páginas web e PDFs com menos distrações. O processamento e as preferências ficam no dispositivo; não há conta nem backend.

O pacote experimental está em validação no Edge antes da primeira release. A correção #26 inclui artigos em componentes com Shadow DOM aberto e uma barra de leitura compacta, com temas aplicados à tela inteira. O ZIP universal com o leitor habilitado pode ser gerado com `npm run package:test`; instalação, permissões e limitações estão na [Wiki](https://github.com/BrunodosSantosVaz/mla/wiki/Uso-e-instalacao). O perfil normal ainda mantém o recurso desligado.

O tema **Auto** acompanha o modo claro/escuro do sistema e mantém a escolha neste dispositivo. Os quatro temas manuais continuam disponíveis. A revisão #32 aproxima a barra da referência visual solicitada, mantém o índice na lateral e acrescenta texto centralizado e largura até 100% da área disponível. Georgia do sistema é a fonte inicial; as fontes offline continuam no seletor.

[Documentação](https://github.com/BrunodosSantosVaz/mla/wiki) · [Discussions](https://github.com/BrunodosSantosVaz/mla/discussions) · [Issues](https://github.com/BrunodosSantosVaz/mla/issues) · [Painel público #33](https://github.com/users/BrunodosSantosVaz/projects/33)

Licença: [MIT](LICENSE). O framework Big Bang mantém licença própria em `.bigbang/LICENSE`.

[Releases](https://github.com/BrunodosSantosVaz/mla/releases) · [Critérios e evidências](https://github.com/BrunodosSantosVaz/mla/wiki/Aceite-do-MVP) · [Segurança](SECURITY.md) · [Contribuindo](CONTRIBUTING.md)

A barra adaptativa mantém uma linha: amostras de tema, fontes Aa e ícones dão lugar a listas e ao menu **Mais opções** quando falta espaço. Largura usa apenas porcentagem e a impressão prepara somente o artigo. [Análise e interações](https://github.com/BrunodosSantosVaz/mla/wiki/Barra-adaptativa-UI-UX).

HTML e PDF locais podem abrir automaticamente após liberar acesso a arquivos no navegador. O leitor usa a rolagem da janela e fontes offline reais nas prévias e no artigo. O popup e as preferências foram reorganizados. [Leitura local e revisão visual](https://github.com/BrunodosSantosVaz/mla/wiki/Leitura-local-e-acabamento).
