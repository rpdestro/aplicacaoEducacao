/**
 * LEITURA E CONVERSÃO DE ARQUIVOS CSV
 * Todo o processamento acontece no navegador (client-side).
 */
Object.assign(SIOPEApp.utils, {
    /** Lê um File como texto UTF-8 (Promise). */
    lerArquivo(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = e => resolve(e.target.result);
            leitor.onerror = () => reject(new Error(`Falha ao ler: ${arquivo.name}`));
            leitor.readAsText(arquivo, 'UTF-8');
        });
    },

    /** Letra de coluna estilo Excel → índice base 0 ("A"→0, "AB"→27). */
    letraParaIndice(letra) {
        let idx = 0;
        const clean = letra.toUpperCase().trim();
        for (let i = 0; i < clean.length; i++) idx = idx * 26 + (clean.charCodeAt(i) - 64);
        return idx - 1;
    },

    /** Divide uma linha pelo separador, respeitando campos entre aspas. */
    splitAspas(linha, separador) {
        const res = []; let emAspas = false, val = "";
        for (let i = 0; i < linha.length; i++) {
            const c = linha[i];
            if (c === '"') emAspas = !emAspas;
            else if (c === separador && !emAspas) { res.push(val.trim().replace(/^"|"$/g, '')); val = ""; }
            else val += c;
        }
        res.push(val.trim().replace(/^"|"$/g, ''));
        return res;
    },

    /**
     * Converte o texto do CSV em lista de objetos.
     * "dicionario" = { letraOuCabecalho: 'Nome do campo' } (ver config/colunas.js).
     * Se todos os cabeçalhos do dicionário existirem no CSV, usa o nome;
     * caso contrário, usa a posição pela letra da coluna.
     */
    csvParaObj(texto, dicionario) {
        const u = SIOPEApp.utils;
        const linhas = texto.split('\n').map(l => l.trim()).filter(l => l !== "");
        if (!linhas.length) return [];
        const sep = linhas[0].includes(';') ? ';' : ',';
        const cabecalhos = linhas[0].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
        const chaves = Object.keys(dicionario);
        const usaHeaders = chaves.every(l => cabecalhos.some(c => c.toUpperCase() === l.toUpperCase()));

        return linhas.slice(1).map(linha => {
            const valores = u.splitAspas(linha, sep);
            const obj = {};
            chaves.forEach(k => {
                const idx = usaHeaders ? cabecalhos.findIndex(c => c.toUpperCase() === k.toUpperCase()) : u.letraParaIndice(k);
                obj[dicionario[k]] = u.sanitizar(valores[idx] || "");
            });
            return obj;
        });
    }
});
