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
    },

    /** Formata tamanho de arquivo em bytes para formato legível (ex: 2.4 MB). */
    formatarBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const tamanhos = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + tamanhos[i];
    },

    /**
     * Analisa o arquivo e primeiras linhas para determinar se é 'receitas' ou 'despesas'.
     * Retorna { tipo: 'receitas' | 'despesas' | 'desconhecido', totalLinhas, confianca }
     */
    detectarTipoCsv(arquivo, texto) {
        const u = SIOPEApp.utils;
        const nome = (arquivo && arquivo.name ? arquivo.name : '').toLowerCase();
        const linhas = texto.split('\n').map(l => l.trim()).filter(l => l !== '');
        const totalLinhas = Math.max(0, linhas.length - 1);
        if (!linhas.length) return { tipo: 'desconhecido', totalLinhas: 0, motivo: 'Arquivo vazio' };

        const sep = linhas[0].includes(';') ? ';' : ',';
        const amostra = linhas.slice(0, Math.min(15, linhas.length));

        let pontosReceita = 0;
        let pontosDespesa = 0;

        // Análise pelo nome do arquivo
        if (nome.includes('rec')) pontosReceita += 3;
        if (nome.includes('desp')) pontosDespesa += 3;

        // Análise de cabeçalhos e linhas de amostra
        const cabecalho = linhas[0].toLowerCase();
        if (cabecalho.includes('empenhado') || cabecalho.includes('liquidado') || cabecalho.includes('subfuncao') || cabecalho.includes('subfunção')) {
            pontosDespesa += 5;
        }
        if (cabecalho.includes('arrecada') || cabecalho.includes('receita') || cabecalho.includes('natureza')) {
            pontosReceita += 5;
        }

        // Amostragem de conteúdo das linhas
        const idxSubFun = u.letraParaIndice('BJ'); // 61
        const idxNat = u.letraParaIndice('R');      // 17
        const idxEmp = u.letraParaIndice('L');      // 11

        for (let i = 1; i < amostra.length; i++) {
            const cols = u.splitAspas(amostra[i], sep);
            
            // Padrão de Função/SubFunção da despesa (ex: 12.122, 12.361, 10.301)
            const valBJ = cols[idxSubFun] || '';
            const valL = cols[idxEmp] || '';
            if (/\b\d{2}\.\d{3}\b/.test(valBJ) || /\b\d{2}\.\d{3}\b/.test(amostra[i])) {
                pontosDespesa += 2;
            }
            if (valL && /[\d.,]+/.test(valL) && cols.length > 50) {
                pontosDespesa += 1;
            }

            // Padrão de Natureza de Receita (1112, 1113, 1711, 1721, 1751, etc.)
            const valR = cols[idxNat] || '';
            if (/^(111|171|172|175|132|19|951)/.test(valR.replace(/[.\s]/g, '')) || /\b(111[234]|171[145]|172[14]|1751)\b/.test(amostra[i])) {
                pontosReceita += 2;
            }
        }

        if (pontosDespesa > pontosReceita) {
            return { tipo: 'despesas', totalLinhas, confianca: pontosDespesa };
        } else if (pontosReceita > pontosDespesa) {
            return { tipo: 'receitas', totalLinhas, confianca: pontosReceita };
        }

        return { tipo: 'desconhecido', totalLinhas, confianca: 0 };
    }
});

