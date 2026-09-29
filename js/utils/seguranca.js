/**
 * UTILITÁRIOS DE SEGURANÇA
 * Evitam injeção de HTML na tela e de fórmulas nas planilhas exportadas.
 */
Object.assign(SIOPEApp.utils, {
    /** Escapa caracteres especiais de HTML (& < > ' "). */
    sanitizar(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    },

    /** Impede que um texto iniciado por = + - @ vire fórmula no Excel. */
    sanitizarExcel(valor) {
        return (typeof valor === 'string' && /^[=+\-@]/.test(valor)) ? "'" + valor : valor;
    }
});
