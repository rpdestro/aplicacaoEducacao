/**
 * CORE — FILTRAGEM DA BASE DE DADOS
 * Aplica os filtros estilo Excel (state.filtros) sobre Receitas ou Despesas.
 * Usado pelo módulo Educação e pela exportação Excel. A Saúde NÃO usa estes
 * filtros (ver core/saude.js).
 */
SIOPEApp.core.filtrar = function (tipo) {
    const { state, config } = SIOPEApp;
    const base = tipo === 'receitas' ? state.receitas : state.despesas;
    const prefix = tipo === 'receitas' ? 'rec_' : 'des_';

    return base.filter(reg => {
        for (const c in state.filtros) {
            if (!c.startsWith(prefix) || !state.filtros[c]) continue;
            const vals = state.filtros[c];
            if (vals.length === 0) return false;
            const linha = String(reg[config.mapaColunas[c]] || '').trim().toLowerCase();
            if (!vals.some(v => linha === v.trim().toLowerCase())) return false;
        }
        return true;
    });
};
