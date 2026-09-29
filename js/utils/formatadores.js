/**
 * UTILITÁRIOS DE NÚMEROS, MOEDA E CÓDIGOS
 */
Object.assign(SIOPEApp.utils, {
    /** Converte "R$ 1.234,56" / "1234.56" / "1,5" em número. Inválido → 0. */
    limparNum(valor) {
        if (!valor) return 0;
        let limpo = valor.toString().trim().replace(/[R$\s]/g, '');
        if (limpo.includes(',') && limpo.includes('.')) {
            if (limpo.indexOf('.') < limpo.indexOf(',')) limpo = limpo.replace(/\./g, '');
        } else if (limpo.includes(',') && !limpo.includes('.')) { limpo = limpo.replace(',', '.'); }
        const n = parseFloat(limpo.replace(',', '.'));
        return isNaN(n) ? 0 : n;
    },

    /** 1234.5 → "R$ 1.234,50" */
    fmtMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    },

    /** 12.3456 → "12,35%" */
    fmtPct(valor) {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    },

    /** Remove pontos/espaços de um código (ex: "1112.50.0.1.00.00" -> "1112500100000"). */
    normalizarCod(cod) {
        return String(cod || '').replace(/[.\s]/g, '');
    },

    /** Soma { e, l, p } de vários acumuladores (Empenhado/Liquidado/Pago). */
    somarELP(...grupos) {
        return grupos.reduce((acc, g) => ({ e: acc.e + g.e, l: acc.l + g.l, p: acc.p + g.p }), { e: 0, l: 0, p: 0 });
    }
});
