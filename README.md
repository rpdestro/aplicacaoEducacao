## 📊 Módulo Orçamentário (Educação e Saúde) - Análise Consolidada

Aplicação web desenvolvida para otimizar e automatizar a análise do orçamento público referente à Educação (SIOPE/FUNDEB - Manutenção e Desenvolvimento do Ensino - Art. 212 da Constituição Federal) e à Saúde (Ações e Serviços Públicos em Saúde - LC 141/2012).

O sistema processa arquivos CSV brutos (com dezenas de colunas e milhares de linhas) de forma 100% local no navegador (*Client-Side*), garantindo segurança total dos dados sensíveis e performance instantânea.

Os dados processados são distribuídos estrategicamente em painéis dedicados para Educação e Saúde, compartilhando a mesma fonte de extração inicial, mas aplicando regras de contabilidade e cálculo de índices específicas para a geração de demonstrativos consolidados prontos para publicação no Diário Oficial.

## ✨ Principais Funcionalidades:

* **Arquitetura Multimodular:** Alternância inteligente e isolada entre os módulos de "Educação (MDE)" e "Saúde (LC 141/2012)", reaproveitando os mesmos arquivos CSV carregados para aplicar diferentes regras de negócio constitucionais (mínimo de 25% para Educação e 15% para Saúde).
* **Processamento Client-Side:** Leitura e sanitização de arquivos CSV diretamente no DOM, estruturado sob o *Module Pattern*, sem necessidade de back-end ou comunicação externa com servidores.
* **Filtros Avançados (Estilo Excel):** Interface de "Base de Dados" com filtros interativos em dropdown por coluna, permitindo pesquisa em tempo real, seleção múltipla e checkbox de categorias.
* **Dashboards Visuais:** Integração modular com `Chart.js` para renderização sob demanda de gráficos de rosca e barras customizados para as despesas e receitas de cada módulo, com auto-ajuste para impressão.
* **Relatórios Oficiais (Impressão/PDF):**

  * *Relatório Completo:* Documento detalhado contemplando as seções analíticas, matrizes (ex: ETI/FUNDEB) e gráficos estruturados para reuniões gerenciais.
  * *Relatório Simples:* Ficha vetorial altamente condensada (máximo 1 a 2 páginas A4), projetada com layout focado no padrão Diário Oficial, omitindo gráficos.
* **Exportação XLSX (Excel):** Extração dos dados dinamicamente filtrados em tela direto para planilhas formatadas utilizando a biblioteca `SheetJS`.

## 📂 Estrutura do Projeto:

```text
/moduloOrcamentario
   │
   ├── index.html   - Esqueleto estrutural sem CSS inline, contendo abas e os containers de conteúdo (Educação e Saúde);
   ├── style.css    - Estrutura visual, grid systems, temas por módulo e regras unificadas de `@media print`;
   ├── script.js    - Motor Core (Module Pattern) controlando o State global, regras de índices independentes, UI e Exports;
   ├── brasao.png   - Logotipo vetorial para os cabeçalhos oficiais dinâmicos (visualização e PDF);
   └── README.md    - Documentação da aplicação.

```

## 👨‍💻 Autor:

```text
Renato Pinheiro Destro
renato.destro@gmail.com
Auxiliar de Escritório / Prefeitura Municipal de Botucatu/SP
```

#### Seja LIVRE, use Linux!

