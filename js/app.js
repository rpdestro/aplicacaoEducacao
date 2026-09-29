/**
 * ============================================================================
 * SIOPEApp - NAMESPACE GLOBAL DA APLICAÇÃO
 * ============================================================================
 * Primeiro script a ser carregado. Cria o objeto único "SIOPEApp" com as
 * gavetas vazias que cada arquivo seguinte vai preencher:
 *
 *   config   → regras fixas e parâmetros       (js/config/*)
 *   state    → dados em memória                (js/state.js)
 *   utils    → funções auxiliares puras        (js/utils/*)
 *   core     → regras de negócio / cálculos    (js/core/*)
 *   ui       → manipulação da tela             (js/ui/*)
 *   filters  → filtros estilo Excel            (js/filters/*)
 *   exports  → Excel, impressão e relatórios   (js/exports/*)
 *   events   → ligação dos botões às funções   (js/events/*)
 *
 * Por que não usar "import/export" (ES Modules)? Porque módulos ES são
 * bloqueados pelo navegador quando o index.html é aberto direto do disco
 * (file://). Com scripts clássicos + namespace, o sistema continua
 * funcionando com um simples duplo-clique, sem precisar de servidor.
 * ============================================================================
 */
const SIOPEApp = {
    config: {},
    state: {},
    utils: {},
    core: {},
    ui: {},
    filters: {},
    exports: {},
    events: {}
};
