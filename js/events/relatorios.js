/**
 * EVENTOS — RELATÓRIOS, IMPRESSÃO E EXCEL
 * ----------------------------------------------------------------------------
 * Um .controls-bar marcado com data-modulo="saude" usa os motores da Saúde;
 * os demais (Educação) usam os motores da Educação.
 */
SIOPEApp.events.registrarRelatorios = function () {
    const ex = SIOPEApp.exports;
    const ehSaude = el => !!el.closest('[data-modulo="saude"]');
    const fecharMenus = () => document.querySelectorAll('.relatorio-menu').forEach(m => m.classList.add('hidden'));

    // Botão Imprimir
    document.querySelectorAll('.btn-print').forEach(b => b.addEventListener('click', function () {
        ehSaude(this) ? ex.printReportSaude(this) : ex.printReport(this);
    }));

    // Split-button: seta abre o menu Completo / Simples
    document.querySelectorAll('.btn-relatorio-caret').forEach(b => b.addEventListener('click', function (e) {
        e.stopPropagation();
        const menu = this.closest('.btn-relatorio-group').querySelector('.relatorio-menu');
        const estavaEscondido = menu.classList.contains('hidden');
        fecharMenus();
        if (estavaEscondido) menu.classList.remove('hidden');
    }));

    // Clique principal = Completo; itens do menu = Completo ou Simples
    document.querySelectorAll('.btn-relatorio-completo, .relatorio-menu-item').forEach(b => b.addEventListener('click', function () {
        fecharMenus();
        const saude = ehSaude(this);
        if (this.dataset.relatorio === 'simples') {
            saude ? ex.gerarRelatorioSimplesSaude(this) : ex.gerarRelatorioSimples(this);
        } else {
            saude ? ex.printReportSaude(this) : ex.printReport(this);
        }
    }));

    // Exportação Excel
    document.querySelector('.btn-excel-rec').addEventListener('click', function () { ex.excel('receitas', this); });
    document.querySelector('.btn-excel-desp').addEventListener('click', function () { ex.excel('despesas', this); });
};
