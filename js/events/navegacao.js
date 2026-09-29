/**
 * EVENTOS — NAVEGAÇÃO (módulos, abas, visões, paginação e referência)
 */
SIOPEApp.events.registrarNavegacao = function () {
    const { ui, state } = SIOPEApp;
    const clique = (id, fn) => document.getElementById(id).addEventListener('click', fn);

    // Módulos Educação / Saúde
    clique('btn-modulo-educacao', () => ui.moduloSwitch('educacao'));
    clique('btn-modulo-saude', () => ui.moduloSwitch('saude'));

    // Sub-abas Receitas / Despesas
    clique('btn-tab-receitas', () => ui.abas('receitas'));
    clique('btn-tab-despesas', () => ui.abas('despesas'));

    // Visão Relatório Executivo / Base de Dados
    clique('btn-visao-relatorio-rec', () => ui.visao('rec', 'relatorio'));
    clique('btn-visao-tabela-rec', () => ui.visao('rec', 'tabela'));
    clique('btn-visao-relatorio-desp', () => ui.visao('desp', 'relatorio'));
    clique('btn-visao-tabela-desp', () => ui.visao('desp', 'tabela'));

    // "Carregar mais 50 registros..."
    clique('container_btn_mais_receitas', () => { state.limiteRec += 50; ui.renderizar(); });
    clique('container_btn_mais_despesas', () => { state.limiteDesp += 50; ui.renderizar(); });

    // Mantém todos os seletores de "Referência" sincronizados
    document.querySelectorAll('.select-referencia').forEach(s => s.addEventListener('change', e => {
        document.querySelectorAll('.select-referencia').forEach(el => el.value = e.target.value);
    }));
};
