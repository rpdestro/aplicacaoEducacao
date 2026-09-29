/**
 * ============================================================================
 * PONTO DE ENTRADA
 * ============================================================================
 * Último script carregado. Quando o HTML termina de carregar, prepara as
 * datas do seletor de referência e liga todos os eventos.
 */
SIOPEApp.init = function () {
    SIOPEApp.ui.initDataAtual();          // Acorda as datas primeiro

    const ev = SIOPEApp.events;
    ev.registrarUpload();
    ev.registrarNavegacao();
    ev.registrarRelatorios();
    ev.registrarFiltros();
};

document.addEventListener('DOMContentLoaded', () => SIOPEApp.init());
