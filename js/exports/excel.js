/**
 * EXPORTS — PLANILHA EXCEL (SheetJS)
 * Exporta os dados JÁ FILTRADOS da Base de Dados. A biblioteca SheetJS só é
 * baixada na primeira exportação (carregamento sob demanda).
 */
SIOPEApp.exports.URL_SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

/** Converte as linhas internas nas colunas da planilha. */
SIOPEApp.exports.mapearParaPlanilha = function (tipo, dados) {
    const u = SIOPEApp.utils;
    if (tipo === 'receitas') {
        return dados.map(r => ({
            'Nat.Despesa': u.sanitizarExcel(r['Nat.Despesa']),
            'Descrição': u.sanitizarExcel(r['Descrição']),
            'Valor Receita': u.limparNum(r['Valor Receita'])
        }));
    }
    return dados.map(r => ({
        'Função/SubFunção': u.sanitizarExcel(r['Função/SubFunção']),
        'Vínculo': u.sanitizarExcel(r['Vínculo']),
        'Fonte': u.sanitizarExcel(r['Fonte']),
        'Valor Empenhado': u.limparNum(r['Valor Empenhado']),
        'Valor Liquidado': u.limparNum(r['Valor Liquidado']),
        'Valor Pago': u.limparNum(r['Valor Pago'])
    }));
};

SIOPEApp.exports.excel = function (tipo, btn) {
    const restaurar = SIOPEApp.exports.helpers.bloquearBotao(btn, '⏳...');
    const dados = SIOPEApp.core.filtrar(tipo);
    if (!dados.length) { restaurar(); return alert('Sem dados.'); }

    const gerar = () => {
        const linhas = SIOPEApp.exports.mapearParaPlanilha(tipo, dados);
        const ws = XLSX.utils.json_to_sheet(linhas), wb = XLSX.utils.book_new();
        const range = XLSX.utils.decode_range(ws['!ref']);
        const colunasMoeda = tipo === 'receitas' ? [2] : [3, 4, 5];

        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            colunasMoeda.forEach(C => {
                const cell = ws[XLSX.utils.encode_cell({ c: C, r: R })];
                if (cell && cell.t === 'n') cell.z = '"R$"#,##0.00;"R$"-#,##0.00';
            });
        }
        XLSX.utils.book_append_sheet(wb, ws, tipo);
        XLSX.writeFile(wb, `${tipo}_filtradas.xlsx`);
        restaurar();
    };

    if (typeof XLSX === 'undefined') {
        const s = document.createElement('script');
        s.src = SIOPEApp.exports.URL_SHEETJS;
        s.onload = gerar;
        document.head.appendChild(s);
    } else {
        gerar();
    }
};
