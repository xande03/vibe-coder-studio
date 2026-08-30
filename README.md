# Vibe Coder Studio

Desenvolver uma aplicação web completa que funcione como uma IDE (Integrated Development Environment) de "Vibe Coding". A plataforma permitirá que usuários descrevam um projeto em linguagem natural e um agente de IA, alimentado pela LLM "agnes-2.5-flash", construa, modifique e gerencie o código-fonte (full stack) do projeto em tempo real, do zero.



Arquitetura e Interface do Usuário (UI/UX):



A interface deve ser dividida em dois painéis principais:



1. Painel Esquerdo: Orquestração e Comando (Console do Agente)



· Campo de Solicitação (Input): Localizado na parte inferior do painel. Um campo de texto expansível onde o usuário insere comandos em linguagem natural (ex: "Crie um dashboard de vendas com gráficos e autenticação de login", "Adicione um botão de exportar para PDF no relatório", "Corrija o bug no formulário de contato").

· Área de Progresso (Log de Atividades): Localizada na parte superior do painel. Exibirá um histórico em tempo real das ações do agente. Cada entrada mostrará:

  · O comando do usuário.

  · O status da tarefa (ex: "Planejando arquitetura...", "Gerando backend...", "Criando componente React...", "Instalando dependências...").

  · Uma síntese final da ação, explicando o que foi construído, alterado ou corrigido após a conclusão de cada tarefa.



2. Painel Direito: Visualização e Gerenciamento do Projeto (IDE)



· Visualizador de Preview: Um iframe ou painel integrado que renderiza a aplicação web em tempo real, permitindo ao usuário ver o resultado do código gerado instantaneamente.

· Gerenciador de Arquivos: Uma árvore de arquivos interativa mostrando a estrutura completa do projeto gerado (pastas frontend, backend, etc.). O usuário pode clicar em um arquivo para visualizar seu código-fonte em um editor com syntax highlighting.

· Barra de Ferramentas do Projeto: Localizada no topo do painel, deve conter, no mínimo:

  · Um botão "Download do Projeto": para baixar todo o código-fonte em um arquivo compactado (.zip).

  · Indicadores de status do servidor (ex: "Backend: Rodando", "Frontend: Build concluído").



Motor de IA (Agente Inteligente):



· Modelo: Utilizar a LLM "agnes-2.5-flash" como o cérebro da aplicação.

· Capacidade de Execução: O agente deve ser capaz de:

  · Construir do Zero: Gerar toda a estrutura de arquivos e código para projetos full stack (frontend e backend), baseado na solicitação do usuário.

  · Modificar: Ler, ajustar e reescrever arquivos existentes com base em novos comandos.

  · Executar Tarefas: Simular e gerenciar um ambiente de desenvolvimento. Isso inclui gerar arquivos de configuração (package.json, requirements.txt), instalar dependências conceitualmente e iniciar servidores para o preview.

  · Gerar Sínteses: Após cada operação, fornecer um resumo claro e conciso do que foi realizado para o usuário.



Tipos de Projetos Suportados (não exaustivos):

O agente deve ser versátil o suficiente para iniciar e gerenciar diferentes tipos de projetos, incluindo, mas não se limitando a:



· Websites e Landing Pages

· Web Apps complexos (Dashboards, CRMs, ferramentas)

· Extensões de navegador

· Slides de apresentação (HTML/CSS/JS)

· Aplicações Full Stack com backend (Node.js, Python, etc.)



Fluxo de Trabalho Principal:



1. O usuário insere uma solicitação no painel esquerdo.

2. O agente (LLM) interpreta a solicitação, planeja a arquitetura do projeto e começa a gerar os arquivos de código.

3. O progresso é exibido em tempo real no "Log de Atividades".

4. O painel direito é atualizado dinamicamente: a árvore de arquivos é preenchida e o preview renderiza a aplicação.

5. O usuário pode fazer novas solicitações para modificar o projeto, e o ciclo se repete.

6. A qualquer momento, o usuário pode baixar o projeto completo.



Requisitos Técnicos e de Design:



· Design: Visual moderno, limpo e profissional, com foco em alta legibilidade de código e usabilidade. Tema escuro é preferível para a área de código.

· Tecnologias (Sugestão): Frontend em React/Vue/Svelte com um editor como Monaco Editor ou CodeMirror. Backend em Node.js/Python para gerenciar a comunicação com a API da LLM e o sistema de arquivos virtual.

· Performance: A comunicação com a LLM deve ser assíncrona para não travar a interface. O preview deve ser atualizado de forma eficiente para refletir as mudanças do código.          chave api: @secret:OPENAI_API_KEY                                                                                                                  URL base: https://apihub.agnes-ai.com/v1

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e7d0bf0e-466a-44b6-8d15-303bde1bc818).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
