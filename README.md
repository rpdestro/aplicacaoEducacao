## 📊 Módulo Orçamentário (Educação e Saúde) - Análise Consolidada

Aplicação web desenvolvida para otimizar e automatizar a análise do orçamento público referente à Educação (SIOPE/FUNDEB - Manutenção e Desenvolvimento do Ensino - Art. 212 da Constituição Federal) e à Saúde (Ações e Serviços Públicos em Saúde - LC 141/2012).

O sistema processa arquivos CSV brutos (com dezenas de colunas e milhares de linhas) de forma 100% local no navegador (*Client-Side*), garantindo segurança total dos dados sensíveis e performance instantânea.

Os dados processados são distribuídos estrategicamente em painéis dedicados para Educação e Saúde, compartilhando a mesma fonte de extração inicial, mas aplicando regras de contabilidade e cálculo de índices específicas para a geração de demonstrativos consolidados prontos para publicação no Diário Oficial.

## ✨ Principais Funcionalidades:

* **Arquitetura Multimodular:** Alternância inteligente e isolada entre os módulos de "Educação (MDE)" e "Saúde (LC 141/2012)", reaproveitando os mesmos arquivos CSV carregados para aplicar diferentes regras de negócio constitucionais (mínimo de 25% para Educação e 15% para Saúde).
* **Processamento Client-Side:** Leitura e sanitização de arquivos CSV diretamente no navegador, sem necessidade de back-end ou comunicação externa com servidores.
* **Filtros Avançados (Estilo Excel):** Interface de "Base de Dados" com filtros interativos em dropdown por coluna, permitindo pesquisa em tempo real, seleção múltipla e checkbox de categorias.
* **Dashboards Visuais:** Integração com `Chart.js` para renderização sob demanda de gráficos de rosca e barras customizados para as despesas e receitas de cada módulo, com auto-ajuste para impressão.
* **Relatórios Oficiais (Impressão/PDF):**

  * *Relatório Completo:* Documento detalhado contemplando as seções analíticas, matrizes (ex: ETI/FUNDEB) e gráficos estruturados para reuniões gerenciais.
  * *Relatório Simples:* Ficha vetorial altamente condensada (máximo 1 a 2 páginas A4), projetada com layout focado no padrão Diário Oficial, omitindo gráficos.
* **Exportação XLSX (Excel):** Extração dos dados dinamicamente filtrados em tela direto para planilhas formatadas utilizando a biblioteca `SheetJS` (carregada sob demanda).

## 🏗️ Arquitetura

O código é organizado em **camadas**, cada uma com uma única responsabilidade. Todas as camadas compartilham um único objeto global, o namespace `SIOPEApp`, criado em `js/app.js`:

```text
  CSV ──► utils (leitura/limpeza) ──► state (dados em memória)
                                          │
                          config (regras) ─┤
                                          ▼
                          core (cálculos puros, sem DOM)
                                          │
                                          ▼
              ui (tela) · filters (filtros) · exports (Excel/PDF)
                                          ▲
                          events (liga os botões às funções)
```

| Camada | Responsabilidade | Pode acessar o DOM? |
|---|---|---|
| `config` | Parâmetros e regras fixas (códigos, percentuais, colunas, textos) | Não |
| `state` | Dados carregados, filtros ativos, paginação, instâncias dos gráficos | Não |
| `utils` | Funções auxiliares puras (CSV, moeda, sanitização) | Não |
| `core` | Regras de negócio e cálculos dos índices | Não |
| `ui` | Escrever valores, montar tabelas, desenhar gráficos, trocar abas | Sim |
| `filters` | Filtros estilo Excel da Base de Dados | Sim |
| `exports` | Excel, Relatório Completo e Relatório Simples | Sim |
| `events` | Registro dos cliques/alterações da página | Sim |

**Por que scripts clássicos e não ES Modules (`import/export`)?** O navegador bloqueia ES Modules quando o `index.html` é aberto direto do disco (`file://`). Usando scripts clássicos com um namespace, o sistema continua funcionando com um simples duplo-clique, sem servidor e sem etapa de build. A consequência é que **a ordem dos `<script>` no `index.html` importa** (ela já está correta e comentada).

## 📂 Estrutura do Projeto:

```text
/moduloOrcamentario
   │
   ├── index.html                          - Esqueleto estrutural (sem CSS inline): abas e containers de Educação e Saúde;
   ├── brasao.png                          - Brasão para os cabeçalhos oficiais (tela e PDF);
   ├── README.md                           - Documentação da aplicação.
   │
   ├── css/
   │   ├── base/
   │   │   ├── variables.css               - Variáveis de cor (design tokens);
   │   │   └── reset.css                   - Box-sizing, body e utilitário .hidden;
   │   ├── layout/
   │   │   ├── upload.css                  - Tela inicial: cabeçalho, cards de upload, dropzones;
   │   │   └── dashboard.css               - Painel pós-upload, abas e separadores de seção;
   │   ├── components/
   │   │   ├── controls.css                - Barra de controles, split-button de relatório, botões;
   │   │   ├── official-header.css         - Cabeçalho oficial com brasão e seletor de referência;
   │   │   ├── charts.css                  - Área dos gráficos;
   │   │   ├── blocos-receita.css          - Blocos de receitas, temas e tabela de lançamentos;
   │   │   ├── barras-total.css            - Barras de totais consolidados;
   │   │   ├── blocos-despesa.css          - Linhas Empenhado/Liquidado/Pago e temas;
   │   │   ├── fundeb-matrix.css           - Matriz de acompanhamento FUNDEB (261/262);
   │   │   ├── eti.css                     - Seção FUNDEB - ETI (Tempo Integral);
   │   │   ├── resumo.css                  - Cards de resumo e percentuais;
   │   │   └── data-table.css              - Base de Dados e filtros estilo Excel;
   │   ├── print.css                       - Regras unificadas de @media print;
   │   └── reports/
   │       ├── relatorio-completo.css      - Modo compacto do Relatório Completo;
   │       └── relatorio-simples.css       - Ficha do Relatório Simples (Diário Oficial).
   │
   └── js/
       ├── app.js                          - Cria o namespace SIOPEApp (1º script);
       ├── state.js                        - Estado global (dados, filtros, paginação, gráficos);
       ├── main.js                         - Ponto de entrada: inicializa tudo (último script);
       │
       ├── config/
       │   ├── colunas.js                  - Letras das colunas dos CSVs e mapa de filtros;
       │   ├── nomenclatura-receitas.js    - Nomes oficiais das receitas por código;
       │   ├── educacao.js                 - Percentual (25%), códigos e vínculos da Educação;
       │   ├── saude.js                    - Percentual (15%), regras e agrupamentos da Saúde;
       │   └── relatorios.js               - Textos institucionais dos relatórios;
       │
       ├── utils/
       │   ├── seguranca.js                - Sanitização contra HTML e fórmulas no Excel;
       │   ├── formatadores.js             - Números, moeda, percentual e códigos;
       │   ├── csv.js                      - Leitura e conversão de CSV em objetos;
       │   └── receitas.js                 - Nomenclatura oficial e soma por prefixo;
       │
       ├── core/
       │   ├── filtro.js                   - Aplica os filtros da Base de Dados;
       │   ├── educacao.js                 - Cálculos MDE, FUNDEB e ETI;
       │   └── saude.js                    - Cálculos LC 141/2012;
       │
       ├── ui/
       │   ├── dom.js                      - Ajudantes de escrita na tela (setTxt, setELP...);
       │   ├── navegacao.js                - Abas, visões, troca de módulo e datas;
       │   ├── tabela-dados.js             - Tabela da Base de Dados com filtros;
       │   ├── graficos.js                 - Gráficos Chart.js;
       │   ├── render-educacao.js          - Preenche o painel de Educação;
       │   └── render-saude.js             - Preenche o painel de Saúde;
       │
       ├── filters/
       │   └── filtros-excel.js            - Lógica dos dropdowns de filtro;
       │
       ├── exports/
       │   ├── helpers.js                  - Trechos comuns (botão ⏳, período, cabeçalho, impressão);
       │   ├── excel.js                    - Exportação XLSX;
       │   ├── relatorio-completo.js       - Impressão completa (Educação e Saúde);
       │   ├── relatorio-simples-educacao.js - Ficha Diário Oficial da Educação;
       │   └── relatorio-simples-saude.js  - Ficha Diário Oficial da Saúde;
       │
       └── events/
           ├── upload.js                   - Seleção e processamento dos CSVs;
           ├── navegacao.js                - Módulos, abas, visões, paginação, referência;
           ├── relatorios.js               - Relatórios, impressão e Excel;
           └── filtros.js                  - Delegação de eventos dos filtros.
```

## 🛠️ Guia Rápido de Manutenção

| Preciso... | Arquivo |
|---|---|
| Mudar a letra de uma coluna do CSV | `js/config/colunas.js` |
| Adicionar/corrigir o nome oficial de uma receita | `js/config/nomenclatura-receitas.js` |
| Alterar órgão, vínculo ou fonte da Saúde | `js/config/saude.js` |
| Alterar vínculos ou códigos da Educação | `js/config/educacao.js` |
| Adicionar uma linha de tributo no Relatório Simples da Saúde | `js/config/saude.js` (`gruposReceitaSaude`) |
| Trocar textos do cabeçalho dos relatórios | `js/config/relatorios.js` |
| Mudar uma fórmula de cálculo | `js/core/educacao.js` ou `js/core/saude.js` |
| Ajustar o layout do PDF | `css/print.css` e `css/reports/` |

### Como adicionar um novo módulo (ex.: Assistência Social)

1. Crie `js/config/assistencia.js` com as regras (percentual, códigos, vínculos);
2. Crie `js/core/assistencia.js` com as funções de cálculo (sem acessar o DOM);
3. Crie `js/ui/render-assistencia.js` para escrever os valores na tela;
4. Se houver relatório próprio, crie `js/exports/relatorio-simples-assistencia.js` usando `SIOPEApp.exports.helpers`;
5. Adicione o botão e o container no `index.html` e registre o clique em `js/events/navegacao.js`;
6. Inclua os novos `<script>` no `index.html` **na camada correspondente** (config → core → ui → exports).

## 🚀 Como usar

1. Abra o `index.html` no navegador (duplo-clique; não precisa de servidor);
2. Selecione os CSVs de **Receitas** e **Despesas** e clique em **Processar e Carregar Dados**;
3. Alterne entre os módulos **Educação** e **Saúde**, aplique filtros e gere os relatórios.

> Requer conexão com a internet apenas para carregar a fonte Inter, o `Chart.js` e, na primeira exportação, o `SheetJS`.

## 👨‍💻 Autor:

```text
Renato Pinheiro Destro
renato.destro@gmail.com
Auxiliar de Escritório / Prefeitura Municipal de Botucatu/SP
```

#### Seja LIVRE, use Linux!
