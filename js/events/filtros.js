/**
 * EVENTOS — FILTROS ESTILO EXCEL (delegação de eventos)
 * ----------------------------------------------------------------------------
 * Os dropdowns são criados dinamicamente (ui/tabela-dados.js), por isso os
 * eventos são escutados no document e identificados pelos data-action.
 */
SIOPEApp.events.registrarFiltros = function () {
    const f = SIOPEApp.filters;

    document.querySelectorAll('.btn-clear').forEach(b => b.addEventListener('click', () => f.limparTodos()));

    document.addEventListener('click', e => {
        // Abrir/fechar dropdown de uma coluna
        const btn = e.target.closest('[data-action="toggle-drop"]');
        if (btn) {
            e.stopPropagation();
            const id = btn.id.replace('btn_drop_', '');
            const drop = btn.closest('th').querySelector('.excel-dropdown');
            document.querySelectorAll('.excel-dropdown').forEach(d => { if (d !== drop) d.classList.add('hidden'); });
            if (drop.classList.contains('hidden')) { f.sincronizar(id); drop.classList.remove('hidden'); }
            else drop.classList.add('hidden');
            return;
        }

        // OK / Cancelar
        const act = e.target.closest('button[data-action]');
        if (act && act.dataset.action === 'apply') return f.aplicar(act.dataset.target);
        if (act && act.dataset.action === 'cancel') return f.fechar(act.dataset.target);

        // Clique fora: fecha dropdowns de filtro e menus de relatório
        if (!e.target.closest('th')) {
            document.querySelectorAll('.excel-dropdown:not(.hidden)').forEach(d => f.fechar(d.id.replace('drop_', '')));
        }
        if (!e.target.closest('.btn-relatorio-group')) {
            document.querySelectorAll('.relatorio-menu:not(.hidden)').forEach(m => m.classList.add('hidden'));
        }
    });

    // Pesquisa dentro do dropdown
    document.addEventListener('input', e => {
        if (e.target.dataset.action === 'search') f.pesquisar(e.target.dataset.target, e.target);
    });

    // Checkboxes (Selecionar Tudo / itens)
    document.addEventListener('change', e => {
        if (e.target.classList.contains('ms-select-all')) f.toggleAll(e.target.dataset.target, e.target.checked);
        else if (e.target.classList.contains('chk-item')) f.verificarAll(e.target.classList.toString().match(/ms-item-([^\s]+)/)[1]);
    });
};
