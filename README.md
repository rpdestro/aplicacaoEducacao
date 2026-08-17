## 📊 Módulo SIOPE/FUNDEB - Análise Consolidada (Receitas e Despesas):



Aplicação web desenvolvida para otimizar e automatizar a análise do orçamento público educacional FUNDEB - (Manutenção e Desenvolvimento do Ensino - Art. 212 da Constituição Federal). Originalmente projetado para o contexto do Departamento de Planejamento e Orçamento do município de Botucatu.

O sistema processa arquivos CSV brutos (com dezenas de colunas e milhares de linhas) de forma 100% local no navegador (\*Client-Side\*), garantindo segurança total dos dados sensíveis e performance instantânea.



## ✨ Principais Funcionalidades:

\* Processamento Client-Side: Leitura e sanitização de arquivos CSV (Receitas e Despesas) diretamente no navegador, sem necessidade de back-end ou envio de dados para servidores.

\* Arquitetura Modular: Código estruturado sob o \*Module Pattern\*, isolando o estado da aplicação (State), lógica de negócio (Core), eventos (Events) e interface (UI).

\* Filtros Avançados (Estilo Excel): A aba "Base de Dados" conta com filtros interativos em dropdown por coluna, permitindo pesquisa em tempo real e seleção múltipla.

\* Dashboards Visuais: Integração com `Chart.js` para renderização dinâmica de gráficos de rosca e barras baseados nos dados liquidados.

\* Exportação para PDF.

\* XLSX (Excel): Exportação dos dados filtrados para planilhas limpas através da biblioteca `SheetJS`.



## ✨ Estrutura:

/

├── index.html     # Esqueleto estrutural, sem CSS inline ou JS obstrusivo.

├── style.css      # Cérebro visual, temas, grid system e regras.

├── script.js      # Motor encapsulado (SIOPEApp), gerenciando estado, lógica, UI e bibliotecas externas.

├── brasao.png     # Logotipo utilizado no cabeçalho dos relatórios oficiais.

└── README.md      # Documentação do projeto.



## 👨‍💻 Autor:

Renato Pinheiro Destro

renato.destro@gmail.com

Auxiliar de Escritório / Prefeitura do Município de Botucatu/SP

Sinta-se à vontade para contribuir, abrir issues ou enviar um pull request!

Seja LIVRE, use Linux!

