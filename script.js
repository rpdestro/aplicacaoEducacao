/**
 * ============================================================================
 * SIOPEApp - MOTOR PRINCIPAL DE PROCESSAMENTO (MODULE PATTERN)
 * ============================================================================
 */
const SIOPEApp = {
    // 1. ESTADO GLOBAL DA APLICAÇÃO (STATE)
    state: {
        receitas: [],
        despesas: [],
        filtros: {},
        limiteRec: 50,
        limiteDesp: 50,
        chartRecInst: null,
        chartDespInst: null,
        chartSaudeInst: null,
        fundebTotal: 1
    },

    // 2. CONFIGURAÇÕES FIXAS
    config: {
        mapaColunas: {
            'rec_NatDespesa': 'Nat.Despesa',
            'rec_Descricao': 'Descrição',
            'rec_ValorReceita': 'Valor Receita',
            'rec_VinculoReceita': 'Vínculo (Receita)', // usado só pelo cálculo do módulo Saúde (Rendimento de Aplicação Financeira)
            'des_FuncaoSubFuncao': 'Função/SubFunção',
            'des_Vinculo': 'Vínculo',
            'des_Fonte': 'Fonte', 
            'des_ValorEmpenhado': 'Valor Empenhado',
            'des_ValorLiquidado': 'Valor Liquidado',
            'des_ValorPago': 'Valor Pago',
            'des_Funcao': 'Função',       // usado só pelo cálculo do módulo Saúde
            'des_Subfuncao': 'Subfunção', // usado só pelo cálculo do módulo Saúde
            'des_Orgao': 'Órgão'          // usado só pelo cálculo do módulo Saúde
        },

        // Nomenclatura oficial das receitas, por código (Nat.Despesa).
        // Substitui a "Descrição" que vem do CSV quando o código bate com algum
        // item aqui. Códigos são comparados sem pontuação (normalizarCod), então
        // "1112.50.0.1.00.00" = "1112500100000".
        // Adiciona, corrige ou remove nomeclaturas:
        nomenclaturaReceitas: {
        '1112.01.1.1.00.00': 'ITR - MUNICÍPIOS CONVENIADOS - PRINCIPAL',
        '1112.50.0.1.00.00': 'IPTU - PRINCIPAL',
        '1112.50.0.2.00.00': 'IPTU - MULTAS E JUROS',
        '1112.50.0.3.00.00': 'IPTU - DÍVIDA ATIVA',
        '1112.50.0.4.00.00': 'IPTU - DÍVIDA ATIVA - MULTAS E JUROS',
        '1112.53.0.1.00.00': 'ITBI - PRINCIPAL',
        '1112.53.0.2.00.00': 'ITBI - MULTAS E JUROS',
        '1112.53.0.3.00.00': 'ITBI - DÍVIDA ATIVA',
        '1112.53.0.4.00.00': 'ITBI - DÍVIDA ATIVA - MULTAS E JUROS',
        '1113.03.1.1.00.00': 'IRRF - TRABALHO - PRINCIPAL',
        '1113.03.4.1.00.00': 'IRRF - OUTROS RENDIMENTOS - PRINCIPAL',
        '1114.51.1.1.01.00': 'ISSQN - NORMAL',
        '1114.51.1.1.02.00': 'ISSQN - SIMPLES NACIONAL',
        '1114.51.1.1.03.00': 'ISSQN - STN',
        '1114.51.1.2.00.00': 'ISSQN - MULTAS E JUROS',
        '1114.51.1.3.00.00': 'ISSQN - DÍVIDA ATIVA',
        '1114.51.1.4.00.00': 'ISSQN - DÍVIDA ATIVA - MULTAS E JUROS',
        '1711.51.1.1.00.00': 'COTA-PARTE FPM MENSAL - PRINCIPAL',
        '1711.51.2.1.01.01': 'COTA-PARTE FPM MENSAL – 1% JULHO',
        '1711.51.2.1.01.02': 'COTA-PARTE FPM MENSAL – 1% SETEMBRO',
        '1711.51.2.1.01.03': 'COTA-PARTE FPM MENSAL – 1% DEZEMBRO',
        '1721.50.0.1.00.00': 'COTA-PARTE ICMS - PRINCIPAL',
        '1721.51.0.1.00.00': 'COTA-PARTE IPVA - PRINCIPAL',
        '1721.52.0.1.00.00': 'COTA-PARTE IPI – PRINCIPAL',
        '9510.00.0.0.00.01': 'ITR',
        '9510.00.0.0.00.02': 'FPM',
        '9510.00.0.0.00.03': 'COTA-PARTE - ICMS',
        '9510.00.0.0.00.04': 'COTA-PARTE - IPVA',
        '9510.00.0.0.00.05': 'COTA-PARTE - IPI',
	    '1321.01.1.1.02.06': 'RENDIMENTO DE APLICAÇÃO FINANCEIRA - FUNDEB',
	    '1751.50.0.1.00.00': 'TRANSFERÊNCIA DE RECURSOS FNDE FUNDEB - PRINCIPAL',
	    '1715.53.0.1.01.00': 'TRANSFERÊNCIA DE RECURSOS FUNDEB DESTINADOS À CRIAÇÃO DE MATRÍCULAS - ETI',
	    '1321.01.1.1.02.01': 'SALÁRIO EDUCAÇÃO',
	    '1321.01.1.1.02.02': 'MERENDA ESCOLAR - ESTADO',
	    '1321.01.1.1.02.04': 'PNAE - PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR',
	    '1321.01.1.1.02.05': 'PNATE - PROGRAMA NACIONAL DE TRANSPORTE ESCOLAR',
	    '1321.01.1.1.02.08': 'APM - ERASMINA GOBETTE',
	    '1321.01.1.1.02.11': 'CONVÊNIO TRANSPORTE ESCOLAR - SEDUC',
	    '1714.50.0.1.00.00': 'SALÁRIO EDUCAÇÃO - PRINCIPAL',
	    '1714.52.0.1.01.00': 'PNAEF',
	    '1714.52.0.1.02.00': 'PNAEM',
	    '1714.52.0.1.03.00': 'PNAE E.J.A',
	    '1714.52.0.1.04.00': 'PNAEC',
	    '1714.52.0.1.05.00': 'PNAEP',
	    '1714.52.0.1.06.00': 'PNAE AEE',
	    '1714.53.0.1.01.00': 'PNATE - ENSINO FUNDAMENTAL',
	    '1714.53.0.1.02.00': 'PNATE - ENSINO MÉDIO',
	    '1714.53.0.1.03.00': 'PNATE - ENSINO INFANTIL',
        '1714.99.0.1.02.00': 'OUTRAS TRANSFERÊNCIAS DIRETAS - FNDE',
	    '1724.51.0.1.02.00': 'CONVÊNIO - ALIMENTAÇÃO ESCOLAR',
	    '1724.51.0.1.03.00': 'CONVÊNIO - TRANSPORTE ESCOLAR - SEDUC'
	    },

        // ====================================================================
        // MÓDULO SAÚDE (LC 141/2012) — parâmetros e regras fixas do módulo.
        // Usa os MESMOS CSVs de Receita/Despesa do módulo Educação; o que muda
        // é apenas o CRITÉRIO de seleção das linhas e o percentual mínimo.
        // Regras abaixo validadas linha a linha contra o Demonstrativo oficial
        // (REF Jan-Ago/2026): todos os totais batem exatamente.
        // ====================================================================
        modulos: {
            saude: {
                percentualMinimo: 0.15, // Art. 198, §2º, III da CF / LC 141/2012 (Educação usa 0.25)

                // Receita "União": diferente da Educação (que soma todo código
                // 1711.*), a Saúde considera apenas a parcela PRINCIPAL do FPM.
                codigoFpmPrincipal: '171151110000', // 1711.51.1.1.00.00 (sem pontuação)

                // Despesa "Saúde Geral": uma linha só é considerada na aplicação
                // obrigatória quando TODAS as condições abaixo são verdadeiras.
                despesa: {
                    funcao: '10',            // Função de governo "Saúde"
                    prefixoSubfuncao: '30',  // Subfunções 10.301 a 10.305 (ações e serviços de saúde)
                    orgao: '0206',           // Secretaria Municipal de Saúde — AJUSTAR se houver reorganização administrativa
                    fonte: '1',              // Fonte de recursos (coluna FONGRUPO, sem zero à esquerda)
                    prefixoVinculo: '310'    // Vínculo/Aplicação "SAÚDE–GERAL" (recursos próprios, Art. 198 CF)
                },

                // Vínculo usado para localizar, na Receita, o "Rendimento de
                // Aplicação Financeira (B)" do Demonstrativo — mesmo prefixo
                // "310" usado na despesa. Some sempre 0,00 se não houver
                // nenhum lançamento com esse vínculo no período (caso normal).
                vinculoRendimentoAplicacao: '310'
            }
        },

        // Agrupamento por "nome do tributo", usado SOMENTE no Relatório Simples
        // (Diário Oficial) da Saúde, para reproduzir fielmente o layout do
        // Demonstrativo oficial (ex: "IPTU" soma principal + multas + dívida
        // ativa em uma única linha). Para adicionar/remover uma linha do
        // relatório, basta editar esta lista — nada mais precisa mudar.
        gruposReceitaSaude: [
            { rotulo: 'ITR MUNICIPALIZADO',           prefixo: '1112.01' },
            { rotulo: 'IPTU',                          prefixo: '1112.50' },
            { rotulo: 'ITBI',                          prefixo: '1112.53' },
            { rotulo: 'IRRF',                          prefixo: '1113' },
            { rotulo: 'ISS',                           prefixo: '1114' },
            { rotulo: 'COTA-PARTE ICMS',               prefixo: '1721.50' },
            { rotulo: 'COTA-PARTE IPVA',               prefixo: '1721.51' },
            { rotulo: 'COTA-PARTE IPI - EXPORTAÇÃO',   prefixo: '1721.52' }
        ]
    },

    // 3. UTILITÁRIOS E AJUDANTES (HELPERS)
    utils: {
        sanitizar(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
        },
        sanitizarExcel(valor) {
            return (typeof valor === 'string' && /^[=+\-@]/.test(valor)) ? "'" + valor : valor;
        },
        lerArquivo(arquivo) {
            return new Promise((resolve, reject) => {
                const leitor = new FileReader();
                leitor.onload = e => resolve(e.target.result);
                leitor.onerror = () => reject(new Error(`Falha ao ler: ${arquivo.name}`));
                leitor.readAsText(arquivo, 'UTF-8');
            });
        },
        letraParaIndice(letra) {
            let idx = 0;
            const clean = letra.toUpperCase().trim();
            for (let i = 0; i < clean.length; i++) idx = idx * 26 + (clean.charCodeAt(i) - 64);
            return idx - 1;
        },
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
        csvParaObj(texto, dicionario) {
            const linhas = texto.split('\n').map(l => l.trim()).filter(l => l !== "");
            if (!linhas.length) return [];
            const sep = linhas[0].includes(';') ? ';' : ',';
            const cabecalhos = linhas[0].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
            const chaves = Object.keys(dicionario);
            const usaHeaders = chaves.every(l => cabecalhos.some(c => c.toUpperCase() === l.toUpperCase()));

            return linhas.slice(1).map(linha => {
                const valores = this.splitAspas(linha, sep);
                const obj = {};
                chaves.forEach(k => {
                    let idx = usaHeaders ? cabecalhos.findIndex(c => c.toUpperCase() === k.toUpperCase()) : this.letraParaIndice(k);
                    obj[dicionario[k]] = this.sanitizar(valores[idx] || "");
                });
                return obj;
            });
        },
        limparNum(valor) {
            if (!valor) return 0;
            let limpo = valor.toString().trim().replace(/[R$\s]/g, '');
            if (limpo.includes(',') && limpo.includes('.')) {
                if (limpo.indexOf('.') < limpo.indexOf(',')) limpo = limpo.replace(/\./g, '');
            } else if (limpo.includes(',') && !limpo.includes('.')) { limpo = limpo.replace(',', '.'); }
            const n = parseFloat(limpo.replace(',', '.'));
            return isNaN(n) ? 0 : n;
        },
        fmtMoeda(valor) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
        },
        fmtPct(valor) {
            return valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        },
        // Remove pontos/espaços de um código para comparação (ex: "1112.50.0.1.00.00" -> "1112500100000")
        normalizarCod(cod) {
            return String(cod || '').replace(/[.\s]/g, '');
        },
        // Retorna o nome oficial da nomenclatura (config.nomenclaturaReceitas) para o
        // código informado; se o código não estiver mapeado, devolve a descrição
        // original que veio do CSV.
        resolverDescricaoReceita(codigo, descricaoCsv) {
            const alvo = this.normalizarCod(codigo);
            const mapa = SIOPEApp.config.nomenclaturaReceitas;
            for (const cod in mapa) {
                if (this.normalizarCod(cod) === alvo) return mapa[cod];
            }
            return descricaoCsv;
        },
        // Soma o "Valor Receita" de todos os itens cujo Nat.Despesa comece pelo
        // prefixo informado (comparação sem pontos, via normalizarCod). Usado
        // pelo relatório simples da Saúde para agrupar por nome do tributo.
        somarPorPrefixo(itens, prefixo) {
            const alvo = this.normalizarCod(prefixo);
            return itens
                .filter(i => this.normalizarCod(i['Nat.Despesa']).startsWith(alvo))
                .reduce((soma, i) => soma + this.limparNum(i['Valor Receita']), 0);
        }
    },

    // 4. LÓGICA DE NEGÓCIO E CONTABILIDADE (CORE)
    core: {
        filtrar(tipo) {
            const base = tipo === 'receitas' ? SIOPEApp.state.receitas : SIOPEApp.state.despesas;
            const prefix = tipo === 'receitas' ? 'rec_' : 'des_';
            return base.filter(reg => {
                for (let c in SIOPEApp.state.filtros) {
                    if (!c.startsWith(prefix) || !SIOPEApp.state.filtros[c]) continue;
                    const vals = SIOPEApp.state.filtros[c];
                    if (vals.length === 0) return false;
                    const linha = String(reg[SIOPEApp.config.mapaColunas[c]] || '').trim().toLowerCase();
                    if (!vals.some(v => linha === v.trim().toLowerCase())) return false;
                }
                return true;
            });
        },
        procReceitas(dados) {
            let r = { mun: { i:[], t:0 }, uniao: { i:[], t:0 }, est: { i:[], t:0 }, ded: { i:[], t:0 },
                      fun: { i:[], t:0 }, funET: { i:[], t:0 }, aplFin: { i:[], t:0 }, fnde: { i:[], t:0 }, estTra: { i:[], t:0 } };
            
            const codA = ['1321.01.1.1.02.01', '1321.01.1.1.02.02', '1321.01.1.1.02.04', '1321.01.1.1.02.05', '1321.01.1.1.02.08', '1321.01.1.1.02.11'];
            const codAC = codA.map(c => c.replace(/\./g, ''));
            const codE = ['1724.51.0.1.02.00', '1724.51.0.1.03.00'];
            const codEC = codE.map(c => c.replace(/\./g, ''));

            dados.forEach(item => {
                const nat = String(item['Nat.Despesa'] || '').trim();
                const nC = nat.replace(/\./g, '');
                const val = SIOPEApp.utils.limparNum(item['Valor Receita']);

                if (nC.startsWith('1112') || nC.startsWith('1113') || nC.startsWith('1114')) { r.mun.i.push(item); r.mun.t += val; } 
                else if (nC.startsWith('1711')) { r.uniao.i.push(item); r.uniao.t += val; } 
                else if (nat.startsWith('1721.50') || nat.startsWith('1721.51') || nat.startsWith('1721.52') || nC.startsWith('172150') || nC.startsWith('172151') || nC.startsWith('172152')) { r.est.i.push(item); r.est.t += val; }
                if (nC.startsWith('9510')) { r.ded.i.push(item); r.ded.t += val; }
                if (nat.startsWith('1751.50') || nC.startsWith('175150') || nat.includes('1321.01.1.1.02.06') || nC.includes('132101110206')) { r.fun.i.push(item); r.fun.t += val; }
                if (nat.includes('1715.53.0.1.01.00') || nC.includes('171553010100')) { r.funET.i.push(item); r.funET.t += val; }
                if (codA.includes(nat) || codAC.includes(nC)) { r.aplFin.i.push(item); r.aplFin.t += val; }
                if (nat.startsWith('1714') || nC.startsWith('1714')) { r.fnde.i.push(item); r.fnde.t += val; }
                if (codE.includes(nat) || codEC.includes(nC)) { r.estTra.i.push(item); r.estTra.t += val; }
            });

            SIOPEApp.state.fundebTotal = r.fun.t > 0 ? r.fun.t : 1; 
            r.totImp = r.mun.t + r.uniao.t + r.est.t;
            r.aplObr = r.totImp * 0.25;
            r.aplMin = r.aplObr - Math.abs(r.ded.t);
            r.totAdi = r.aplFin.t + r.fnde.t + r.estTra.t;
            return r;
        },
        procDespesas(dados) {
            let d = { i122: {e:0, l:0, p:0}, i361: {e:0, l:0, p:0}, i365: {e:0, l:0, p:0}, i367: {e:0, l:0, p:0}, v261: {e:0, l:0, p:0}, v262: {e:0, l:0, p:0} };
            const vPerm = ['200.012', '210.000', '220.000', '240.000'];

            dados.forEach(item => {
                const f = String(item['Função/SubFunção'] || '').trim();
                const fnt = String(item['Fonte'] || '').trim().replace(/^0+/, '');
                const v = String(item['Vínculo'] || '').trim();
                
                const isF1 = fnt === '1' || fnt.startsWith('1 ') || fnt.startsWith('1-');
                const isV = vPerm.some(vp => v.includes(vp));
                const e = SIOPEApp.utils.limparNum(item['Valor Empenhado']);
                const l = SIOPEApp.utils.limparNum(item['Valor Liquidado']);
                const p = SIOPEApp.utils.limparNum(item['Valor Pago']);

                if (isF1 && isV) {
                    if (f.includes('12.122') || f.replace(/\./g, '').includes('12122')) { d.i122.e += e; d.i122.l += l; d.i122.p += p; } 
                    else if (f.includes('12.361') || f.replace(/\./g, '').includes('12361')) { d.i361.e += e; d.i361.l += l; d.i361.p += p; } 
                    else if (f.includes('12.365') || f.replace(/\./g, '').includes('12365')) { d.i365.e += e; d.i365.l += l; d.i365.p += p; } 
                    else if (f.includes('12.367') || f.replace(/\./g, '').includes('12367')) { d.i367.e += e; d.i367.l += l; d.i367.p += p; }
                }
                if (v.includes('261.000')) { d.v261.e += e; d.v261.l += l; d.v261.p += p; }
                else if (v.includes('262.000')) { d.v262.e += e; d.v262.l += l; d.v262.p += p; }
            });
            return d;
        },
        procETI(dados) {
            let e = { e261: { e:0, l:0, p:0 }, e262: { e:0, l:0, p:0 } };
            dados.forEach(item => {
                const v = String(item['BW'] || item['Vínculo'] || item['CA Codigo'] || '').trim();
                const emp = SIOPEApp.utils.limparNum(item['Valor Empenhado']);
                const liq = SIOPEApp.utils.limparNum(item['Valor Liquidado']);
                const pgo = SIOPEApp.utils.limparNum(item['Valor Pago']);
                if (v.includes('261.004') || v.includes('261.0004')) { e.e261.e += emp; e.e261.l += liq; e.e261.p += pgo; } 
                else if (v.includes('262.004') || v.includes('262.0004')) { e.e262.e += emp; e.e262.l += liq; e.e262.p += pgo; }
            });
            e.tot = { e: e.e261.e + e.e262.e, l: e.e261.l + e.e262.l, p: e.e261.p + e.e262.p };
            return e;
        },

        // ====================================================================
        // MÓDULO SAÚDE (LC 141/2012)
        // Recebe a base COMPLETA de receitas (SIOPEApp.state.receitas) — a
        // Saúde não usa os filtros de coluna da tabela "Base de Dados" de
        // Educação, pois seu recorte já é definido pelas regras fixas abaixo.
        // ====================================================================
        procReceitasSaude(dados) {
            const cfg = SIOPEApp.config.modulos.saude;
            let r = { mun: { i: [], t: 0 }, uniao: { i: [], t: 0 }, est: { i: [], t: 0 }, rendApFin: { i: [], t: 0 } };

            dados.forEach(item => {
                const nat = String(item['Nat.Despesa'] || '').trim();
                const nC = SIOPEApp.utils.normalizarCod(nat);
                const val = SIOPEApp.utils.limparNum(item['Valor Receita']);
                const vinc = String(item['Vínculo (Receita)'] || '').trim();

                if (nC.startsWith('1112') || nC.startsWith('1113') || nC.startsWith('1114')) { r.mun.i.push(item); r.mun.t += val; }
                else if (nC === cfg.codigoFpmPrincipal) { r.uniao.i.push(item); r.uniao.t += val; }
                else if (nat.startsWith('1721.50') || nat.startsWith('1721.51') || nat.startsWith('1721.52') || nC.startsWith('172150') || nC.startsWith('172151') || nC.startsWith('172152')) { r.est.i.push(item); r.est.t += val; }

                // Rendimento de Aplicação Financeira (B): receita com o mesmo
                // vínculo "310" usado na despesa. Normalmente 0,00.
                if (vinc.startsWith(cfg.vinculoRendimentoAplicacao)) { r.rendApFin.i.push(item); r.rendApFin.t += val; }
            });

            r.totImp = r.mun.t + r.uniao.t + r.est.t;
            r.aplicObrigA = r.totImp * cfg.percentualMinimo;
            r.aplicMinima = r.aplicObrigA + r.rendApFin.t;
            return r;
        },

        // Recebe a base COMPLETA de despesas (mesmo motivo do comentário acima).
        procDespesasSaude(dados) {
            const cfg = SIOPEApp.config.modulos.saude.despesa;
            let d = { saudeGeral: { e: 0, l: 0, p: 0 } };

            dados.forEach(item => {
                const funcao = String(item['Função'] || '').trim();
                const subf = String(item['Subfunção'] || '').trim();
                const orgao = String(item['Órgão'] || '').trim();
                const vinc = String(item['Vínculo'] || '').trim();
                const fonte = String(item['Fonte'] || '').trim().replace(/^0+/, '');

                const bate = funcao === cfg.funcao &&
                             subf.startsWith(cfg.prefixoSubfuncao) &&
                             orgao === cfg.orgao &&
                             fonte === cfg.fonte &&
                             vinc.startsWith(cfg.prefixoVinculo);

                if (bate) {
                    d.saudeGeral.e += SIOPEApp.utils.limparNum(item['Valor Empenhado']);
                    d.saudeGeral.l += SIOPEApp.utils.limparNum(item['Valor Liquidado']);
                    d.saudeGeral.p += SIOPEApp.utils.limparNum(item['Valor Pago']);
                }
            });
            return d;
        }
    },

    // 5. MANIPULAÇÃO DA INTERFACE (UI)
    ui: {
        initDataAtual() {
            const dataAtual = new Date();
            const anoAtual = dataAtual.getFullYear(); 
            const mesAtual = dataAtual.getMonth(); 
            const nomesMeses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
            
            document.querySelectorAll('.opt-mensal').forEach(opt => {
                opt.textContent = `${nomesMeses[mesAtual]}/${anoAtual}`;
            });
            
            // Substitui todas as tags {ano} pelo ano real do computador
            document.querySelectorAll('.opt-ano').forEach(opt => {
                opt.textContent = opt.textContent.replace(/{ano}/g, anoAtual);
            });
        },
        setTxt(id, val) { const el = document.getElementById(id); if(el) el.textContent = val; },
        setTbd(id, itens) {
            const el = document.getElementById(id); if(!el) return;
            if (!itens || !itens.length) { el.innerHTML = '<tr><td colspan="3" class="col-empty">Nenhum lançamento encontrado para esta regra.</td></tr>'; return; }
            el.innerHTML = itens.map(i => `<tr><td class="col-nat">${i['Nat.Despesa'] || ''}</td><td class="col-desc">${i['Descrição'] || ''}</td><td class="col-val">${SIOPEApp.utils.fmtMoeda(SIOPEApp.utils.limparNum(i['Valor Receita']))}</td></tr>`).join('');
        },
        nomeArquivo(tipo, input) {
            const lbl = document.getElementById(`label-${tipo}`);
            if (input.files && input.files[0]) {
                const n = SIOPEApp.utils.sanitizar(input.files[0].name);
                const cr = tipo === 'receitas' ? '#10b981' : '#ef4444'; 
                lbl.textContent = n;
                document.querySelector(`#drop-zone-${tipo} .dropzone-subtitle`).innerHTML = `<span style="color: ${cr}; font-weight: bold;">✓</span> <span style="color: ${cr}; font-weight: 500;">${n} anexado</span>`;
            }
        },
        abas(aba) {
            const r = document.getElementById('modulo-receitas'), d = document.getElementById('modulo-despesas');
            const br = document.getElementById('btn-tab-receitas'), bd = document.getElementById('btn-tab-despesas');
            if(aba === 'receitas') { r.classList.remove('hidden'); d.classList.add('hidden'); br.classList.add('active'); bd.classList.remove('active'); } 
            else { r.classList.add('hidden'); d.classList.remove('hidden'); br.classList.remove('active'); bd.classList.add('active'); }
            
            if (SIOPEApp.state.receitas.length > 0 || SIOPEApp.state.despesas.length > 0) {
                setTimeout(() => SIOPEApp.ui.renderizar(), 50);
            }
        },
        visao(tipo, v) {
            const pre = tipo === 'rec' ? 'receitas' : 'despesas';
            const b = document.getElementById(`container-blocos-${pre}`);
            const t = document.getElementById(`container-tabela-${pre}-wrapper`);
            const br = document.getElementById(`btn-visao-relatorio-${tipo}`);
            const bt = document.getElementById(`btn-visao-tabela-${tipo}`);
            if(v === 'relatorio') { b.style.display = 'block'; t.classList.remove('active'); br.classList.add('active'); bt.classList.remove('active'); } 
            else { b.style.display = 'none'; t.classList.add('active'); br.classList.remove('active'); bt.classList.add('active'); }
        },
        montarTabela(dados, id, tipo) {
            const cont = document.getElementById(id);
            if(!cont) return;
            if(!dados.length) { cont.innerHTML = `<p class="col-empty">Sem dados.</p>`; return; }
            const cabs = Object.keys(dados[0]);
            let h = `<div class="responsive-table"><table class="tabela-moderna"><thead><tr>`;
            cabs.forEach((c, idx) => {
                const cid = Object.keys(SIOPEApp.config.mapaColunas).find(k => SIOPEApp.config.mapaColunas[k] === c);
                const vals = [...new Set(dados.map(i => String(i[c]).trim()))].sort();
                const isV = c.includes('Valor');
                const wid = tipo === 'receitas' ? (c === 'Descrição' ? 'width: 60%;' : 'width: 20%;') : (c === 'Vínculo' ? 'width: 25%;' : (c === 'Fonte' ? 'width: 20%;' : (c === 'Função/SubFunção' ? 'width: 15%;' : 'width: 13.3%;')));
                const dropC = idx === cabs.length - 1 ? 'excel-dropdown dropdown-last-child hidden' : 'excel-dropdown hidden';
                h += `
                    <th data-col="${c}" style="${wid}">
                        <div class="th-container ${isV ? 'th-right' : 'th-left'}">
                            <span class="th-title-text">${c}</span>
                            <button id="btn_drop_${cid}" class="btn-filtro-excel" data-action="toggle-drop">
                                <span id="txt_${cid}">Todos</span> 🔻
                            </button>
                        </div>
                        <div id="drop_${cid}" class="${dropC}">
                            <input type="text" class="excel-search-input" data-action="search" data-target="${cid}" placeholder="Pesquisar...">
                            <label class="select-all-label"><input type="checkbox" class="ms-select-all" data-target="${cid}"> Selecionar Tudo</label>
                            <div class="excel-options-list">
                                ${vals.map(v => `<label class="ms-item-label"><input type="checkbox" class="chk-item ms-item-${cid}" value="${v.replace(/"/g, '&quot;')}"> <span>${v || '(Vazio)'}</span></label>`).join('')}
                            </div>
                            <div class="excel-dropdown-actions">
                                <button class="btn-excel-ok" data-action="apply" data-target="${cid}">OK</button>
                                <button class="btn-excel-limpar" data-action="cancel" data-target="${cid}">Cancelar</button>
                            </div>
                        </div>
                    </th>`;
            });
            h += `</tr></thead><tbody id="tbody_rows_${tipo}"></tbody></table></div>`;
            cont.innerHTML = h;
        },
        renderizar() {
            // Renderiza Receitas
            const rFilt = SIOPEApp.core.filtrar('receitas');
            const tbR = document.getElementById('tbody_rows_receitas');
            if(tbR) {
                tbR.innerHTML = rFilt.slice(0, SIOPEApp.state.limiteRec).map(i => `<tr><td class="col-monospaced">${i['Nat.Despesa']}</td><td class="col-desc">${i['Descrição']}</td><td class="col-right">${SIOPEApp.utils.fmtMoeda(SIOPEApp.utils.limparNum(i['Valor Receita']))}</td></tr>`).join('');
                document.getElementById('container_btn_mais_receitas').style.display = rFilt.length > SIOPEApp.state.limiteRec ? 'block' : 'none';
            }
            const rp = SIOPEApp.core.procReceitas(rFilt);
            this.setTxt('rec-mun-val', SIOPEApp.utils.fmtMoeda(rp.mun.t)); this.setTbd('rec-mun-tbd', rp.mun.i);
            this.setTxt('rec-uni-val', SIOPEApp.utils.fmtMoeda(rp.uniao.t)); this.setTbd('rec-uni-tbd', rp.uniao.i);
            this.setTxt('rec-est-val', SIOPEApp.utils.fmtMoeda(rp.est.t)); this.setTbd('rec-est-tbd', rp.est.i);
            this.setTxt('rec-tot-imp-val', SIOPEApp.utils.fmtMoeda(rp.totImp));
            this.setTxt('rec-apl-obr-val', SIOPEApp.utils.fmtMoeda(rp.aplObr)); this.setTbd('rec-apl-obr-tbd', []);
            this.setTxt('rec-ded-val', SIOPEApp.utils.fmtMoeda(rp.ded.t)); this.setTbd('rec-ded-tbd', rp.ded.i);
            this.setTxt('rec-apl-min-val', SIOPEApp.utils.fmtMoeda(rp.aplMin));
            this.setTxt('rec-fun-pri-val', SIOPEApp.utils.fmtMoeda(rp.fun.t)); this.setTbd('rec-fun-pri-tbd', rp.fun.i);
            this.setTxt('rec-fun-et-val', SIOPEApp.utils.fmtMoeda(rp.funET.t)); this.setTbd('rec-fun-et-tbd', rp.funET.i);
            this.setTxt('rec-apl-fin-val', SIOPEApp.utils.fmtMoeda(rp.aplFin.t)); this.setTbd('rec-apl-fin-tbd', rp.aplFin.i);
            this.setTxt('rec-fnd-val', SIOPEApp.utils.fmtMoeda(rp.fnde.t)); this.setTbd('rec-fnd-tbd', rp.fnde.i);
            this.setTxt('rec-est-tra-val', SIOPEApp.utils.fmtMoeda(rp.estTra.t)); this.setTbd('rec-est-tra-tbd', rp.estTra.i);
            this.setTxt('rec-tot-adi-val', SIOPEApp.utils.fmtMoeda(rp.totAdi));

            // Renderiza Despesas
            const dFilt = SIOPEApp.core.filtrar('despesas');
            const tbD = document.getElementById('tbody_rows_despesas');
            if(tbD) {
                tbD.innerHTML = dFilt.slice(0, SIOPEApp.state.limiteDesp).map(i => `<tr><td class="col-monospaced">${i['Função/SubFunção']}</td><td class="col-desc">${i['Vínculo']}</td><td class="col-center">${i['Fonte']}</td><td class="col-right">${SIOPEApp.utils.fmtMoeda(SIOPEApp.utils.limparNum(i['Valor Empenhado']))}</td><td class="col-right">${SIOPEApp.utils.fmtMoeda(SIOPEApp.utils.limparNum(i['Valor Liquidado']))}</td><td class="col-right col-destaque">${SIOPEApp.utils.fmtMoeda(SIOPEApp.utils.limparNum(i['Valor Pago']))}</td></tr>`).join('');
                document.getElementById('container_btn_mais_despesas').style.display = dFilt.length > SIOPEApp.state.limiteDesp ? 'block' : 'none';
            }
            const dp = SIOPEApp.core.procDespesas(dFilt);
            const cP = v => SIOPEApp.state.fundebTotal > 0 ? (v / SIOPEApp.state.fundebTotal) * 100 : 0;
            const tFE = dp.v261.e + dp.v262.e, tFL = dp.v261.l + dp.v262.l, tFP = dp.v261.p + dp.v262.p;

            this.setTxt('f-261-emp', SIOPEApp.utils.fmtMoeda(dp.v261.e)); this.setTxt('f-261-liq', SIOPEApp.utils.fmtMoeda(dp.v261.l)); this.setTxt('f-261-pag', SIOPEApp.utils.fmtMoeda(dp.v261.p));
            this.setTxt('f-262-emp', SIOPEApp.utils.fmtMoeda(dp.v262.e)); this.setTxt('f-262-liq', SIOPEApp.utils.fmtMoeda(dp.v262.l)); this.setTxt('f-262-pag', SIOPEApp.utils.fmtMoeda(dp.v262.p));
            this.setTxt('f-tot-emp', SIOPEApp.utils.fmtMoeda(tFE)); this.setTxt('f-tot-liq', SIOPEApp.utils.fmtMoeda(tFL)); this.setTxt('f-tot-pag', SIOPEApp.utils.fmtMoeda(tFP));
            this.setTxt('fp-261-emp', SIOPEApp.utils.fmtPct(cP(dp.v261.e))); this.setTxt('fp-261-liq', SIOPEApp.utils.fmtPct(cP(dp.v261.l))); this.setTxt('fp-261-pag', SIOPEApp.utils.fmtPct(cP(dp.v261.p)));
            this.setTxt('fp-262-emp', SIOPEApp.utils.fmtPct(cP(dp.v262.e))); this.setTxt('fp-262-liq', SIOPEApp.utils.fmtPct(cP(dp.v262.l))); this.setTxt('fp-262-pag', SIOPEApp.utils.fmtPct(cP(dp.v262.p)));
            this.setTxt('fp-tot-emp', SIOPEApp.utils.fmtPct(cP(tFE))); this.setTxt('fp-tot-liq', SIOPEApp.utils.fmtPct(cP(tFL))); this.setTxt('fp-tot-pag', SIOPEApp.utils.fmtPct(cP(tFP)));

            const eti = SIOPEApp.core.procETI(dFilt);
            this.setTxt('eti-261-emp', SIOPEApp.utils.fmtMoeda(eti.e261.e)); this.setTxt('eti-261-liq', SIOPEApp.utils.fmtMoeda(eti.e261.l)); this.setTxt('eti-261-pag', SIOPEApp.utils.fmtMoeda(eti.e261.p));
            this.setTxt('eti-262-emp', SIOPEApp.utils.fmtMoeda(eti.e262.e)); this.setTxt('eti-262-liq', SIOPEApp.utils.fmtMoeda(eti.e262.l)); this.setTxt('eti-262-pag', SIOPEApp.utils.fmtMoeda(eti.e262.p));
            this.setTxt('eti-tot-emp', SIOPEApp.utils.fmtMoeda(eti.tot.e)); this.setTxt('eti-tot-liq', SIOPEApp.utils.fmtMoeda(eti.tot.l)); this.setTxt('eti-tot-pag', SIOPEApp.utils.fmtMoeda(eti.tot.p));

            const tE = dp.i122.e + dp.i361.e + dp.i365.e + dp.i367.e;
            const tL = dp.i122.l + dp.i361.l + dp.i365.l + dp.i367.l;
            const tP = dp.i122.p + dp.i361.p + dp.i365.p + dp.i367.p;
            this.setTxt('res-emp-val', SIOPEApp.utils.fmtMoeda(tE)); this.setTxt('res-emp-pct', (rp.aplMin>0?((tE*25)/rp.aplMin).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '0,00') + '%');
            this.setTxt('res-liq-val', SIOPEApp.utils.fmtMoeda(tL)); this.setTxt('res-liq-pct', (rp.aplMin>0?((tL*25)/rp.aplMin).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '0,00') + '%');
            this.setTxt('res-pag-val', SIOPEApp.utils.fmtMoeda(tP)); this.setTxt('res-pag-pct', (rp.aplMin>0?((tP*25)/rp.aplMin).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '0,00') + '%');

            this.setTxt('d-12122-emp', SIOPEApp.utils.fmtMoeda(dp.i122.e)); this.setTxt('d-12122-liq', SIOPEApp.utils.fmtMoeda(dp.i122.l)); this.setTxt('d-12122-pag', SIOPEApp.utils.fmtMoeda(dp.i122.p));
            this.setTxt('d-12361-emp', SIOPEApp.utils.fmtMoeda(dp.i361.e)); this.setTxt('d-12361-liq', SIOPEApp.utils.fmtMoeda(dp.i361.l)); this.setTxt('d-12361-pag', SIOPEApp.utils.fmtMoeda(dp.i361.p));
            this.setTxt('d-12365-emp', SIOPEApp.utils.fmtMoeda(dp.i365.e)); this.setTxt('d-12365-liq', SIOPEApp.utils.fmtMoeda(dp.i365.l)); this.setTxt('d-12365-pag', SIOPEApp.utils.fmtMoeda(dp.i365.p));
            this.setTxt('d-12367-emp', SIOPEApp.utils.fmtMoeda(dp.i367.e)); this.setTxt('d-12367-liq', SIOPEApp.utils.fmtMoeda(dp.i367.l)); this.setTxt('d-12367-pag', SIOPEApp.utils.fmtMoeda(dp.i367.p));

            this.graficos(rp, dp);
        },
        graficos(rp, dp) {
            if(typeof Chart === 'undefined') return;

            const cxR = document.getElementById('chartReceitas');
            if(cxR && cxR.offsetParent !== null) { 
                if(SIOPEApp.state.chartRecInst) SIOPEApp.state.chartRecInst.destroy();
                SIOPEApp.state.chartRecInst = new Chart(cxR, { type: 'doughnut', data: { labels: ['Municipal', 'União', 'Estado', 'Fundeb', 'Adicionais'], datasets: [{ data: [rp.mun.t, rp.uniao.t, rp.est.t, rp.fun.t, (rp.aplFin.t + rp.fnde.t + rp.estTra.t)], backgroundColor: ['#10b981', '#059669', '#34d399', '#0ea5e9', '#6366f1'], borderWidth: 0 }] }, options: { maintainAspectRatio: false, animation: false, devicePixelRatio: Math.max(window.devicePixelRatio || 1, 3), plugins: { legend: { position: 'right' } }, cutout: '65%' } });
            }
            
            const cxD = document.getElementById('chartDespesas');
            if(cxD && cxD.offsetParent !== null) { 
                if(SIOPEApp.state.chartDespInst) SIOPEApp.state.chartDespInst.destroy();
                SIOPEApp.state.chartDespInst = new Chart(cxD, { 
                    type: 'bar', 
                    data: { 
                        labels: ['12.122', '12.361', '12.365', '12.367'], 
                        datasets: [{ 
                            label: 'Liquidado', 
                            data: [dp.i122.l, dp.i361.l, dp.i365.l, dp.i367.l], 
                            backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(99,102,241,0.7)', 'rgba(139,92,246,0.7)', 'rgba(20,184,166,0.7)'] 
                        }] 
                    }, 
                    options: { 
                        maintainAspectRatio: false, 
                        animation: false, 
                        devicePixelRatio: Math.max(window.devicePixelRatio || 1, 3), 
                        plugins: { 
                            legend: { 
                                display: true,
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    font: { size: 10 },
                                    generateLabels: (chart) => {
                                        const bg = chart.data.datasets[0].backgroundColor;
                                        const rotulos = ['12.122 - Admin. Geral', '12.361 - Ensino Fund.', '12.365 - Educ. Infantil', '12.367 - Educ. Especial'];
                                        return rotulos.map((r, i) => ({ 
                                            text: r, 
                                            fillStyle: bg[i], 
                                            strokeStyle: bg[i], 
                                            lineWidth: 0, 
                                            hidden: false, 
                                            index: i 
                                        }));
                                    }
                                }
                            } 
                        } 
                    } 
                });
            }
        },

        // ====================================================================
        // MÓDULO SAÚDE — troca de módulo e renderização própria.
        // Isolado de propósito: nada aqui mexe no código de Educação acima, e
        // vice-versa. Se amanhã a regra da Saúde mudar, o impacto fica restrito
        // a este bloco + core.procReceitasSaude/procDespesasSaude.
        // ====================================================================
        moduloSwitch(modulo) {
            const btnEdu = document.getElementById('btn-modulo-educacao'), btnSau = document.getElementById('btn-modulo-saude');
            const contEdu = document.getElementById('conteudo-modulo-educacao'), contSau = document.getElementById('conteudo-modulo-saude');
            const paraSaude = modulo === 'saude';

            btnEdu.classList.toggle('active', !paraSaude);
            btnSau.classList.toggle('active', paraSaude);
            contEdu.classList.toggle('hidden', paraSaude);
            contSau.classList.toggle('hidden', !paraSaude);

            if (paraSaude && (SIOPEApp.state.receitas.length || SIOPEApp.state.despesas.length)) {
                SIOPEApp.ui.renderizarSaude();
            }
        },

        // Saúde sempre calcula sobre a base COMPLETA (state.receitas/despesas),
        // e não sobre core.filtrar(): seus critérios (função/órgão/vínculo) já
        // definem o recorte certo, e usar os filtros de coluna de Educação
        // aqui geraria números incoerentes com o Demonstrativo oficial.
        renderizarSaude() {
            const rp = SIOPEApp.core.procReceitasSaude(SIOPEApp.state.receitas);
            const dp = SIOPEApp.core.procDespesasSaude(SIOPEApp.state.despesas);
            const fmt = SIOPEApp.utils.fmtMoeda, fmtP = SIOPEApp.utils.fmtPct;

            this.setTxt('saude-mun-val', fmt(rp.mun.t)); this.setTbd('saude-mun-tbd', rp.mun.i);
            this.setTxt('saude-uni-val', fmt(rp.uniao.t)); this.setTbd('saude-uni-tbd', rp.uniao.i);
            this.setTxt('saude-est-val', fmt(rp.est.t)); this.setTbd('saude-est-tbd', rp.est.i);
            this.setTxt('saude-tot-imp-val', fmt(rp.totImp));

            this.setTxt('saude-apl-obr-val', fmt(rp.aplicObrigA));
            this.setTxt('saude-rend-val', fmt(rp.rendApFin.t));
            this.setTxt('saude-apl-min-val', fmt(rp.aplicMinima));

            this.setTxt('saude-desp-emp-val', fmt(dp.saudeGeral.e));
            this.setTxt('saude-desp-liq-val', fmt(dp.saudeGeral.l));
            this.setTxt('saude-desp-pag-val', fmt(dp.saudeGeral.p));

            // Percentual de Aplicação = despesa ÷ TOTAL DE IMPOSTOS E
            // TRANSFERÊNCIAS (não é ÷ pela aplicação mínima) — validado
            // contra o Demonstrativo oficial (35,96% / 32,21% / 30,92%).
            const pct = v => rp.totImp > 0 ? fmtP((v / rp.totImp) * 100) : '0,00%';
            this.setTxt('saude-pct-emp', pct(dp.saudeGeral.e));
            this.setTxt('saude-pct-liq', pct(dp.saudeGeral.l));
            this.setTxt('saude-pct-pag', pct(dp.saudeGeral.p));

            this.graficosSaude(rp);
        },
        graficosSaude(rp) {
            if (typeof Chart === 'undefined') return;
            const cx = document.getElementById('chartSaude');
            if (!cx || cx.offsetParent === null) return;
            if (SIOPEApp.state.chartSaudeInst) SIOPEApp.state.chartSaudeInst.destroy();
            SIOPEApp.state.chartSaudeInst = new Chart(cx, {
                type: 'doughnut',
                data: {
                    labels: ['Municipal', 'União (FPM)', 'Estado'],
                    datasets: [{ data: [rp.mun.t, rp.uniao.t, rp.est.t], backgroundColor: ['#e11d48', '#fb7185', '#fda4af'], borderWidth: 0 }]
                },
                options: { maintainAspectRatio: false, animation: false, devicePixelRatio: Math.max(window.devicePixelRatio || 1, 3), plugins: { legend: { position: 'right' } }, cutout: '65%' }
            });
        }
    },

    // 6. SISTEMA DE FILTROS (FILTERS)
    filters: {
        limparTodos() {
            SIOPEApp.state.filtros = {};
            document.querySelectorAll('.btn-filtro-excel').forEach(b => { b.classList.remove('active-filter'); document.getElementById(`txt_${b.id.replace('btn_drop_','')}`).innerText = "Todos"; SIOPEApp.filters.sincronizar(b.id.replace('btn_drop_','')); });
            SIOPEApp.state.limiteRec = 50; SIOPEApp.state.limiteDesp = 50;
            SIOPEApp.ui.renderizar();
        },
        pesquisar(id, input) {
            const t = input.value.toLowerCase();
            document.querySelectorAll(`#drop_${id} .ms-item-label`).forEach(lbl => lbl.style.display = lbl.textContent.toLowerCase().includes(t) ? '' : 'none');
        },
        toggleAll(id, isChecked) { document.querySelectorAll(`.ms-item-${id}`).forEach(c => { if(c.closest('label').style.display !== 'none') c.checked = isChecked; }); },
        verificarAll(id) { document.querySelector(`.ms-select-all[data-target="${id}"]`).checked = Array.from(document.querySelectorAll(`.ms-item-${id}`)).every(c => c.checked); },
        sincronizar(id) {
            const vals = SIOPEApp.state.filtros[id];
            if(vals === undefined) { document.querySelectorAll(`.ms-item-${id}`).forEach(c => c.checked = false); document.querySelector(`.ms-select-all[data-target="${id}"]`).checked = false; } 
            else { document.querySelectorAll(`.ms-item-${id}`).forEach(c => c.checked = vals.includes(c.value)); this.verificarAll(id); }
        },
        fechar(id) {
            document.getElementById(`drop_${id}`).classList.add('hidden');
            document.querySelector(`#drop_${id} .excel-search-input`).value = "";
            document.querySelectorAll(`#drop_${id} .ms-item-label`).forEach(l => l.style.display = '');
            this.sincronizar(id);
        },
        aplicar(id) {
            const vals = [];
            document.querySelectorAll(`.ms-item-${id}`).forEach(c => { if(c.checked) vals.push(c.value); });
            if(vals.length === document.querySelectorAll(`.ms-item-${id}`).length || vals.length === 0) delete SIOPEApp.state.filtros[id]; 
            else SIOPEApp.state.filtros[id] = vals; 
            SIOPEApp.state.limiteRec = 50; SIOPEApp.state.limiteDesp = 50;
            const cbs = document.querySelectorAll(`.ms-item-${id}`);
            const t = document.getElementById(`txt_${id}`), b = document.getElementById(`btn_drop_${id}`);
            if(!SIOPEApp.state.filtros[id]) { t.innerText = "Todos"; b.classList.remove('active-filter'); }
            else if(vals.length === 1) { t.innerText = vals[0]; b.classList.add('active-filter'); }
            else { t.innerText = vals.length + " sel."; b.classList.add('active-filter'); }
            document.getElementById(`drop_${id}`).classList.add('hidden');
            SIOPEApp.ui.renderizar();
        }
    },

    // 7. EXPORTAÇÕES (EXCEL E PDF)
    exports: {
        excel(tipo, btn) {
            const orig = btn.innerHTML; btn.innerHTML = "⏳..."; btn.disabled = true;
            const dados = SIOPEApp.core.filtrar(tipo);
            if(!dados.length) { btn.innerHTML = orig; btn.disabled = false; return alert('Sem dados.'); }
            const func = () => {
                const maped = tipo === 'receitas' ? dados.map(r => ({ 'Nat.Despesa': SIOPEApp.utils.sanitizarExcel(r['Nat.Despesa']), 'Descrição': SIOPEApp.utils.sanitizarExcel(r['Descrição']), 'Valor Receita': SIOPEApp.utils.limparNum(r['Valor Receita']) })) : dados.map(r => ({ 'Função/SubFunção': SIOPEApp.utils.sanitizarExcel(r['Função/SubFunção']), 'Vínculo': SIOPEApp.utils.sanitizarExcel(r['Vínculo']), 'Fonte': SIOPEApp.utils.sanitizarExcel(r['Fonte']), 'Valor Empenhado': SIOPEApp.utils.limparNum(r['Valor Empenhado']), 'Valor Liquidado': SIOPEApp.utils.limparNum(r['Valor Liquidado']), 'Valor Pago': SIOPEApp.utils.limparNum(r['Valor Pago']) }));
                const ws = XLSX.utils.json_to_sheet(maped), wb = XLSX.utils.book_new();
                const range = XLSX.utils.decode_range(ws['!ref']);
                for(let R = range.s.r + 1; R <= range.e.r; ++R) {
                    (tipo==='receitas'?[2]:[3,4,5]).forEach(C => { const cell = ws[XLSX.utils.encode_cell({c: C, r: R})]; if(cell && cell.t === 'n') cell.z = '"R$"#,##0.00;"R$"-#,##0.00'; });
                }
                XLSX.utils.book_append_sheet(wb, ws, tipo);
                XLSX.writeFile(wb, `${tipo}_filtradas.xlsx`);
                btn.innerHTML = orig; btn.disabled = false;
            };
            if(typeof XLSX === 'undefined') { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = func; document.head.appendChild(s); } else func();
        },
        printReport(btn) {
            const orig = btn ? btn.innerHTML : '';
            if (btn) { btn.innerHTML = "⏳ Preparando..."; btn.disabled = true; }
            
            const modRec = document.getElementById('modulo-receitas');
            const modDesp = document.getElementById('modulo-despesas');
            const recHidden = modRec.classList.contains('hidden');
            const despHidden = modDesp.classList.contains('hidden');

            // 0. Ativa o modo compacto (fontes/tabelas menores, sem sombras)
            //    ANTES de mexer nos gráficos. É essencial fazer isso antes, e
            //    não só via @media print: os gráficos (Chart.js) precisam
            //    medir e desenhar no tamanho FINAL enquanto a página ainda
            //    está rodando normalmente. Se o tamanho só mudasse durante a
            //    impressão (que trava a thread principal), o Chart.js não
            //    teria tempo de terminar o redesenho e o gráfico saía
            //    deformado, vazando por cima de outras seções do relatório.
            document.body.classList.add('gerando-relatorio-completo');

            // 1. Mostra ambas as telas em modo Relatório para a foto
            SIOPEApp.ui.visao('rec', 'relatorio');
            SIOPEApp.ui.visao('desp', 'relatorio');
            modRec.classList.remove('hidden');
            modDesp.classList.remove('hidden');

            // 2. Com os dois módulos agora visíveis e já no layout compacto
            //    final, recria os gráficos do zero. Isso é essencial:
            //    graficos() só cria a instância do Chart.js se o
            //    canvas estiver visível (offsetParent !== null) no momento da chamada.
            //    Como normalmente só uma aba fica visível por vez, o gráfico da aba
            //    que NÃO estava ativa podia nunca ter sido criado (chartXInst = null),
            //    saindo em branco no PDF. Chamando renderizar() aqui, com ambos os
            //    módulos visíveis e já no tamanho compacto, garantimos que os DOIS
            //    gráficos existam e sejam desenhados corretamente antes da impressão.
            SIOPEApp.ui.renderizar();

            // 3. Aguarda o processamento de tela do navegador (dá tempo do
            //    Chart.js terminar de desenhar os gráficos no tamanho novo)
            setTimeout(() => {
                if (btn) { btn.innerHTML = orig; btn.disabled = false; }
                
                // 4. Chama a impressora (PDF)
                window.print(); 

                // 5. Restaura o estado anterior
                document.body.classList.remove('gerando-relatorio-completo');
                if (recHidden) modRec.classList.add('hidden');
                if (despHidden) modDesp.classList.add('hidden');
                SIOPEApp.ui.abas(recHidden ? 'despesas' : 'receitas'); 
            }, 500);
        },

        // Relatório Simples: ficha única no padrão do modelo oficial (REF / EDUCAÇÃO 25% /
        // IMPOSTOS E TRANSFERÊNCIAS / FUNDEB), com os lançamentos reais por código,
        // sem gráficos, pensada para caber em 1 (no máximo 2) folhas A4.
        gerarRelatorioSimples(btn) {
            const orig = btn ? btn.innerHTML : '';
            if (btn) { btn.innerHTML = "⏳ Preparando..."; btn.disabled = true; }

            const fmt = SIOPEApp.utils.fmtMoeda, u = SIOPEApp.utils;
            const rFilt = SIOPEApp.core.filtrar('receitas');
            const dFilt = SIOPEApp.core.filtrar('despesas');
            const rp = SIOPEApp.core.procReceitas(rFilt);
            const dp = SIOPEApp.core.procDespesas(dFilt);
            const eti = SIOPEApp.core.procETI(dFilt);

            const tE = dp.i122.e + dp.i361.e + dp.i365.e + dp.i367.e;
            const tL = dp.i122.l + dp.i361.l + dp.i365.l + dp.i367.l;
            const tP = dp.i122.p + dp.i361.p + dp.i365.p + dp.i367.p;
            const pct = base => rp.aplMin > 0 ? u.fmtPct((base * 25) / rp.aplMin) : '0,00%';
            const tFE = dp.v261.e + dp.v262.e, tFL = dp.v261.l + dp.v262.l, tFP = dp.v261.p + dp.v262.p;
            const cP = val => SIOPEApp.state.fundebTotal > 0 ? u.fmtPct((val / SIOPEApp.state.fundebTotal) * 100) : '0,00%';

            const sel = document.querySelector('.select-referencia');
            const periodo = sel ? sel.options[sel.selectedIndex].textContent.trim() : '';
            const geradoEm = new Date().toLocaleString('pt-BR');

            // Linhas de itens (código | descrição | valor) de um grupo de receita
            const linhasItens = itens => (!itens || !itens.length)
                ? `<tr><td class="rs-cod">—</td><td>Nenhum lançamento encontrado.</td><td class="rs-val"></td></tr>`
                : itens.map(i => `<tr><td class="rs-cod">${i['Nat.Despesa'] || ''}</td><td>${i['Descrição'] || ''}</td><td class="rs-val">${fmt(u.limparNum(i['Valor Receita']))}</td></tr>`).join('');

            const html = `
                <div class="rs-doc">
                    <div class="rs-header">
                        <img src="./brasao.png" alt="Brasão" class="rs-logo">
                        <div class="rs-header-text">
                            <h2>PREFEITURA MUNICIPAL DE BOTUCATU</h2>
                            <h3>SECRETARIA MUNICIPAL DA FAZENDA</h3>
                            <p>Departamento de Planejamento e Orçamento</p>
                        </div>
                    </div>

                    <div class="rs-bar">REF: ${periodo}</div>
                    <div class="rs-bar rs-bar-grande">EDUCAÇÃO 25%</div>
                    <div class="rs-subtitulo">
                        MANUTENÇÃO E DESENVOLVIMENTO DO ENSINO<br>
                        ART. 212 - CONSTITUIÇÃO FEDERAL
                    </div>

                    <div class="rs-secao">IMPOSTOS E TRANSFERÊNCIAS</div>
                    <table class="rs-tabela">
                        <tr class="rs-grupo"><td colspan="3">MUNICIPAL</td></tr>
                        ${linhasItens(rp.mun.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL MUNICIPAL</td><td class="rs-val">${fmt(rp.mun.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DA UNIÃO</td></tr>
                        ${linhasItens(rp.uniao.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL UNIÃO</td><td class="rs-val">${fmt(rp.uniao.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DO ESTADO</td></tr>
                        ${linhasItens(rp.est.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL ESTADO</td><td class="rs-val">${fmt(rp.est.t)}</td></tr>

                        <tr class="rs-total rs-total-escuro"><td colspan="2">TOTAL IMPOSTOS E TRANSFERÊNCIAS</td><td class="rs-val">${fmt(rp.totImp)}</td></tr>
                        <tr class="rs-formula"><td colspan="2"><em>APLICAÇÃO OBRIGATÓRIA - 25%</em></td><td class="rs-val">${fmt(rp.aplObr)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">DEDUÇÕES PARA FORMAÇÃO FUNDEB</td></tr>
                        ${linhasItens(rp.ded.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL DEDUÇÕES</td><td class="rs-val">${fmt(rp.ded.t)}</td></tr>

                        <tr class="rs-total rs-total-escuro"><td colspan="2">APLICAÇÃO MÍNIMA OBRIGATÓRIA - RECURSOS PRÓPRIOS</td><td class="rs-val">${fmt(rp.aplMin)}</td></tr>
                    </table>

                    <div class="rs-secao">DESPESAS CONSIDERADAS NA APLICAÇÃO OBRIGATÓRIA (FONTE 1)</div>
                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>FUNÇÃO / SUBFUNÇÃO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        <tr><td>12.122 - Admin. Geral</td><td class="rs-val">${fmt(dp.i122.e)}</td><td class="rs-val">${fmt(dp.i122.l)}</td><td class="rs-val">${fmt(dp.i122.p)}</td></tr>
                        <tr><td>12.361 - Ensino Fundamental</td><td class="rs-val">${fmt(dp.i361.e)}</td><td class="rs-val">${fmt(dp.i361.l)}</td><td class="rs-val">${fmt(dp.i361.p)}</td></tr>
                        <tr><td>12.365 - Educação Infantil</td><td class="rs-val">${fmt(dp.i365.e)}</td><td class="rs-val">${fmt(dp.i365.l)}</td><td class="rs-val">${fmt(dp.i365.p)}</td></tr>
                        <tr><td>12.367 - Educação Especial</td><td class="rs-val">${fmt(dp.i367.e)}</td><td class="rs-val">${fmt(dp.i367.l)}</td><td class="rs-val">${fmt(dp.i367.p)}</td></tr>
                        <tr class="rs-total"><td>TOTAL</td><td class="rs-val">${fmt(tE)}</td><td class="rs-val">${fmt(tL)}</td><td class="rs-val">${fmt(tP)}</td></tr>
                        <tr class="rs-pct"><td>PERCENTUAL DE APLICAÇÃO</td><td class="rs-val">${pct(tE)}</td><td class="rs-val">${pct(tL)}</td><td class="rs-val">${pct(tP)}</td></tr>
                    </table>

                    <div class="rs-bar rs-bar-grande">FUNDEB</div>
                    <table class="rs-tabela">
                        ${linhasItens(rp.fun.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL</td><td class="rs-val">${fmt(rp.fun.t)}</td></tr>
                    </table>

                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>VÍNCULO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        <tr><td>261.0000</td><td class="rs-val">${fmt(dp.v261.e)}</td><td class="rs-val">${fmt(dp.v261.l)}</td><td class="rs-val">${fmt(dp.v261.p)}</td></tr>
                        <tr><td>262.0000</td><td class="rs-val">${fmt(dp.v262.e)}</td><td class="rs-val">${fmt(dp.v262.l)}</td><td class="rs-val">${fmt(dp.v262.p)}</td></tr>
                        <tr class="rs-total"><td>TOTAL</td><td class="rs-val">${fmt(tFE)}</td><td class="rs-val">${fmt(tFL)}</td><td class="rs-val">${fmt(tFP)}</td></tr>
                        <tr class="rs-pct"><td>261.00 (mín. 70%)</td><td class="rs-val">${cP(dp.v261.e)}</td><td class="rs-val">${cP(dp.v261.l)}</td><td class="rs-val">${cP(dp.v261.p)}</td></tr>
                        <tr class="rs-pct"><td>262.00 (máx. 30%)</td><td class="rs-val">${cP(dp.v262.e)}</td><td class="rs-val">${cP(dp.v262.l)}</td><td class="rs-val">${cP(dp.v262.p)}</td></tr>
                        <tr class="rs-pct rs-pct-total"><td>TOTAL</td><td class="rs-val">${cP(tFE)}</td><td class="rs-val">${cP(tFL)}</td><td class="rs-val">${cP(tFP)}</td></tr>
                    </table>

                    <div class="rs-secao">FUNDEB - FOMENTO A MATRÍCULAS ETI (VÍNCULOS 261.0004 / 262.0004)</div>
                    <!-- Receita ETI: apenas informativa (não soma em nenhum total do relatório) -->
                    <table class="rs-tabela">
                        <tr class="rs-grupo"><td colspan="3">RECEITA</td></tr>
                        ${linhasItens(rp.funET.i)}
                        <tr class="rs-total"><td colspan="2">TOTAL RECEITA ETI</td><td class="rs-val">${fmt(rp.funET.t)}</td></tr>
                    </table>
                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>VÍNCULO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        <tr><td>05.261.0004</td><td class="rs-val">${fmt(eti.e261.e)}</td><td class="rs-val">${fmt(eti.e261.l)}</td><td class="rs-val">${fmt(eti.e261.p)}</td></tr>
                        <tr><td>05.262.0004</td><td class="rs-val">${fmt(eti.e262.e)}</td><td class="rs-val">${fmt(eti.e262.l)}</td><td class="rs-val">${fmt(eti.e262.p)}</td></tr>
                        <tr class="rs-total"><td>TOTAL</td><td class="rs-val">${fmt(eti.tot.e)}</td><td class="rs-val">${fmt(eti.tot.l)}</td><td class="rs-val">${fmt(eti.tot.p)}</td></tr>
                    </table>

                    <p class="rs-footer">Documento gerado eletronicamente em ${geradoEm} — Módulo EDUCAÇÃO (Art.212-CF/1988)</p>
                </div>
            `;


            const container = document.getElementById('relatorio-simples');
            container.innerHTML = html;
            document.body.classList.add('modo-relatorio-simples');

            setTimeout(() => {
                if (btn) { btn.innerHTML = orig; btn.disabled = false; }
                window.print();
                document.body.classList.remove('modo-relatorio-simples');
                container.innerHTML = '';
            }, 300);
        },

        // ====================================================================
        // MÓDULO SAÚDE — Relatório Completo (com gráfico) e Relatório Simples
        // (padrão Diário Oficial, espelhando o Demonstrativo LC 141/2012).
        // ====================================================================

        // Completo: o painel da Saúde é um bloco único (não dividido em abas
        // Receitas/Despesas como Educação), então basta garantir que o
        // container de Educação fique fora do fluxo de impressão (classe
        // "imprimindo-saude", ver style.css) e redesenhar o gráfico no
        // tamanho compacto final antes de chamar window.print().
        printReportSaude(btn) {
            const orig = btn ? btn.innerHTML : '';
            if (btn) { btn.innerHTML = "⏳ Preparando..."; btn.disabled = true; }

            document.body.classList.add('gerando-relatorio-completo', 'imprimindo-saude');
            SIOPEApp.ui.renderizarSaude();

            setTimeout(() => {
                if (btn) { btn.innerHTML = orig; btn.disabled = false; }
                window.print();
                document.body.classList.remove('gerando-relatorio-completo', 'imprimindo-saude');
            }, 400);
        },

        // Simples: reaproveita o MESMO container #relatorio-simples e a mesma
        // classe body.modo-relatorio-simples já usados pela Educação — nenhum
        // CSS novo é necessário. Os agrupamentos por tributo (config.gruposReceitaSaude)
        // existem só aqui, pois são específicos do layout do Diário Oficial.
        gerarRelatorioSimplesSaude(btn) {
            const orig = btn ? btn.innerHTML : '';
            if (btn) { btn.innerHTML = "⏳ Preparando..."; btn.disabled = true; }

            const fmt = SIOPEApp.utils.fmtMoeda, fmtP = SIOPEApp.utils.fmtPct, u = SIOPEApp.utils;
            const rp = SIOPEApp.core.procReceitasSaude(SIOPEApp.state.receitas);
            const dp = SIOPEApp.core.procDespesasSaude(SIOPEApp.state.despesas);
            const pct = v => rp.totImp > 0 ? fmtP((v / rp.totImp) * 100) : '0,00%';

            const sel = document.querySelector('.select-referencia');
            const periodo = sel ? sel.options[sel.selectedIndex].textContent.trim() : '';
            const geradoEm = new Date().toLocaleString('pt-BR');

            // Uma linha por tributo do grupo Municipal ou Estadual (config.gruposReceitaSaude).
            // "prefixosBloco" filtra quais grupos da config pertencem a este bloco
            // (ex.: Municipal = códigos que começam por 1112/1113/1114).
            const linhaGrupo = (rotulo, valor) => `<tr><td colspan="2">${rotulo}</td><td class="rs-val">${fmt(valor)}</td></tr>`;
            const linhasDoBloco = (itens, prefixosBloco) => SIOPEApp.config.gruposReceitaSaude
                .filter(g => prefixosBloco.some(p => g.prefixo.startsWith(p)))
                .map(g => linhaGrupo(g.rotulo, u.somarPorPrefixo(itens, g.prefixo)))
                .join('');

            const html = `
                <div class="rs-doc">
                    <div class="rs-header">
                        <img src="./brasao.png" alt="Brasão" class="rs-logo">
                        <div class="rs-header-text">
                            <h2>PREFEITURA MUNICIPAL DE BOTUCATU</h2>
                            <h3>SECRETARIA DE GOVERNO</h3>
                            <p>Departamento de Planejamento e Orçamento</p>
                        </div>
                    </div>

                    <div class="rs-bar">REF: ${periodo}</div>
                    <div class="rs-bar rs-bar-grande">SAÚDE</div>
                    <div class="rs-subtitulo">
                        AÇÕES E SERVIÇOS PÚBLICOS EM SAÚDE<br>
                        LEI COMPLEMENTAR FEDERAL N.º 141/2012
                    </div>

                    <div class="rs-secao">IMPOSTOS E TRANSFERÊNCIAS</div>
                    <table class="rs-tabela">
                        <tr class="rs-grupo"><td colspan="3">MUNICIPAL</td></tr>
                        ${linhasDoBloco(rp.mun.i, ['1112', '1113', '1114'])}
                        <tr class="rs-total"><td colspan="2">TOTAL MUNICIPAL</td><td class="rs-val">${fmt(rp.mun.t)}</td></tr>

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DA UNIÃO</td></tr>
                        ${linhaGrupo('FPM', rp.uniao.t)}

                        <tr class="rs-grupo"><td colspan="3">TRANSFERÊNCIAS DO ESTADO</td></tr>
                        ${linhasDoBloco(rp.est.i, ['1721'])}
                        <tr class="rs-total"><td colspan="2">TOTAL ESTADO</td><td class="rs-val">${fmt(rp.est.t)}</td></tr>

                        <tr class="rs-total rs-total-escuro"><td colspan="2">TOTAL IMPOSTOS E TRANSFERÊNCIAS</td><td class="rs-val">${fmt(rp.totImp)}</td></tr>
                        <tr class="rs-formula"><td colspan="2"><em>APLICAÇÃO OBRIGATÓRIA - 15% (A)</em></td><td class="rs-val">${fmt(rp.aplicObrigA)}</td></tr>
                        <tr class="rs-formula"><td colspan="2"><em>RENDIMENTO DE APLICAÇÃO FINANCEIRA - 15% (B)</em></td><td class="rs-val">${fmt(rp.rendApFin.t)}</td></tr>
                        <tr class="rs-total rs-total-escuro"><td colspan="2">APLICAÇÃO MÍNIMA OBRIGATÓRIA - RECURSOS PRÓPRIOS (A) + (B)</td><td class="rs-val">${fmt(rp.aplicMinima)}</td></tr>
                    </table>

                    <div class="rs-secao">DESPESAS CONSIDERADAS NA APLICAÇÃO OBRIGATÓRIA</div>
                    <table class="rs-tabela rs-tabela-3col">
                        <tr class="rs-cabecalho-col"><td>VÍNCULO</td><td>EMPENHADO</td><td>LIQUIDADO</td><td>PAGO</td></tr>
                        <tr><td>Saúde Geral</td><td class="rs-val">${fmt(dp.saudeGeral.e)}</td><td class="rs-val">${fmt(dp.saudeGeral.l)}</td><td class="rs-val">${fmt(dp.saudeGeral.p)}</td></tr>
                        <tr class="rs-pct rs-pct-total"><td>PERCENTUAL DE APLICAÇÃO</td><td class="rs-val">${pct(dp.saudeGeral.e)}</td><td class="rs-val">${pct(dp.saudeGeral.l)}</td><td class="rs-val">${pct(dp.saudeGeral.p)}</td></tr>
                    </table>

                    <p class="rs-footer">Documento gerado eletronicamente em ${geradoEm} — Módulo SAÚDE (LC-141/2012)</p>
                </div>
            `;

            const container = document.getElementById('relatorio-simples');
            container.innerHTML = html;
            document.body.classList.add('modo-relatorio-simples');

            setTimeout(() => {
                if (btn) { btn.innerHTML = orig; btn.disabled = false; }
                window.print();
                document.body.classList.remove('modo-relatorio-simples');
                container.innerHTML = '';
            }, 300);
        }
    },

    // 8. DELEGAÇÃO DE EVENTOS E INICIALIZAÇÃO
    events: {
        init() {
            document.getElementById('csv-receitas').addEventListener('change', e => SIOPEApp.ui.nomeArquivo('receitas', e.target));
            document.getElementById('csv-despesas').addEventListener('change', e => SIOPEApp.ui.nomeArquivo('despesas', e.target));
            
            document.getElementById('btn-processar').addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                const fR = document.getElementById('csv-receitas').files[0], fD = document.getElementById('csv-despesas').files[0];
                if (!fR || !fD) return alert('Selecione os dois arquivos CSV.');
                const origTxt = btn.innerHTML; btn.innerHTML = "⏳ Processando..."; btn.disabled = true;
                try {
                    const [txtR, txtD] = await Promise.all([SIOPEApp.utils.lerArquivo(fR), SIOPEApp.utils.lerArquivo(fD)]);
                    // 'AN'/'D'/'E'/'S' abaixo são usados exclusivamente pelo módulo Saúde
                    // (Vínculo da receita, Função, Subfunção e Órgão da despesa).
                    SIOPEApp.state.receitas = SIOPEApp.utils.csvParaObj(txtR, { 'R': 'Nat.Despesa', 'K': 'Descrição', 'AB': 'Valor Receita', 'AN': 'Vínculo (Receita)' });
                    SIOPEApp.state.despesas = SIOPEApp.utils.csvParaObj(txtD, { 'D': 'Função', 'E': 'Subfunção', 'S': 'Órgão', 'BJ': 'Função/SubFunção', 'BW': 'Vínculo', 'AT': 'Fonte', 'L': 'Valor Empenhado', 'N': 'Valor Liquidado', 'P': 'Valor Pago' });

                    // Substitui a "Descrição" importada do CSV pela nomenclatura oficial
                    // (config.nomenclaturaReceitas), mantendo o texto do CSV como fallback
                    // para códigos ainda não cadastrados no dicionário.
                    SIOPEApp.state.receitas.forEach(item => {
                        item['Descrição'] = SIOPEApp.utils.resolverDescricaoReceita(item['Nat.Despesa'], item['Descrição']);
                    });
                    SIOPEApp.state.filtros = {}; SIOPEApp.state.limiteRec = 50; SIOPEApp.state.limiteDesp = 50;
                    
                    SIOPEApp.ui.montarTabela(SIOPEApp.state.receitas, 'nova-tabela-receitas', 'receitas');
                    SIOPEApp.ui.montarTabela(SIOPEApp.state.despesas, 'nova-tabela-despesas', 'despesas');
                    
                    document.getElementById('upload-section').classList.add('hidden');
                    document.getElementById('dashboard').classList.remove('hidden');
                    SIOPEApp.ui.abas('receitas');
                    
                } catch(err) { alert("Erro: " + err.message); } finally { btn.innerHTML = origTxt; btn.disabled = false; }
            });

            document.getElementById('btn-tab-receitas').addEventListener('click', () => SIOPEApp.ui.abas('receitas'));
            document.getElementById('btn-tab-despesas').addEventListener('click', () => SIOPEApp.ui.abas('despesas'));

            // Troca entre os módulos Educação e Saúde (mesmos CSVs, cálculos independentes)
            document.getElementById('btn-modulo-educacao').addEventListener('click', () => SIOPEApp.ui.moduloSwitch('educacao'));
            document.getElementById('btn-modulo-saude').addEventListener('click', () => SIOPEApp.ui.moduloSwitch('saude'));

            document.getElementById('btn-visao-relatorio-rec').addEventListener('click', () => SIOPEApp.ui.visao('rec', 'relatorio'));
            document.getElementById('btn-visao-tabela-rec').addEventListener('click', () => SIOPEApp.ui.visao('rec', 'tabela'));
            document.getElementById('btn-visao-relatorio-desp').addEventListener('click', () => SIOPEApp.ui.visao('desp', 'relatorio'));
            document.getElementById('btn-visao-tabela-desp').addEventListener('click', () => SIOPEApp.ui.visao('desp', 'tabela'));

            // Direciona o botão de Impressão para o motor certo: um controls-bar
            // marcado com data-modulo="saude" usa o motor da Saúde; os demais
            // (Educação) seguem usando o motor original, inalterado.
            document.querySelectorAll('.btn-print').forEach(b => b.addEventListener('click', function() {
                this.closest('[data-modulo="saude"]') ? SIOPEApp.exports.printReportSaude(this) : SIOPEApp.exports.printReport(this);
            }));

            // Botão de relatório (split-button): clique principal = Relatório Completo,
            // seta = abre menu com "Relatório Completo" e "Relatório Simples"
            document.querySelectorAll('.btn-relatorio-caret').forEach(b => b.addEventListener('click', function(e) {
                e.stopPropagation();
                const menu = this.closest('.btn-relatorio-group').querySelector('.relatorio-menu');
                const estavaEscondido = menu.classList.contains('hidden');
                document.querySelectorAll('.relatorio-menu').forEach(m => m.classList.add('hidden'));
                if (estavaEscondido) menu.classList.remove('hidden');
            }));
            document.querySelectorAll('.btn-relatorio-completo, .relatorio-menu-item').forEach(b => b.addEventListener('click', function() {
                document.querySelectorAll('.relatorio-menu').forEach(m => m.classList.add('hidden'));
                const ehSaude = this.closest('[data-modulo="saude"]');
                if (this.dataset.relatorio === 'simples') { ehSaude ? SIOPEApp.exports.gerarRelatorioSimplesSaude(this) : SIOPEApp.exports.gerarRelatorioSimples(this); }
                else { ehSaude ? SIOPEApp.exports.printReportSaude(this) : SIOPEApp.exports.printReport(this); }
            }));
            document.querySelector('.btn-excel-rec').addEventListener('click', function() { SIOPEApp.exports.excel('receitas', this) });
            document.querySelector('.btn-excel-desp').addEventListener('click', function() { SIOPEApp.exports.excel('despesas', this) });
            document.querySelectorAll('.btn-clear').forEach(b => b.addEventListener('click', SIOPEApp.filters.limparTodos));
            
            document.getElementById('container_btn_mais_receitas').addEventListener('click', () => { SIOPEApp.state.limiteRec += 50; SIOPEApp.ui.renderizar(); });
            document.getElementById('container_btn_mais_despesas').addEventListener('click', () => { SIOPEApp.state.limiteDesp += 50; SIOPEApp.ui.renderizar(); });

            document.querySelectorAll('.select-referencia').forEach(s => s.addEventListener('change', e => document.querySelectorAll('.select-referencia').forEach(el => el.value = e.target.value)));

            document.addEventListener('click', e => {
                const btn = e.target.closest('[data-action="toggle-drop"]');
                if (btn) {
                    e.stopPropagation(); const id = btn.id.replace('btn_drop_', ''); const drop = btn.closest('th').querySelector('.excel-dropdown');
                    document.querySelectorAll('.excel-dropdown').forEach(d => { if (d !== drop) d.classList.add('hidden'); });
                    if (drop.classList.contains('hidden')) { SIOPEApp.filters.sincronizar(id); drop.classList.remove('hidden'); } else drop.classList.add('hidden');
                    return;
                }
                const act = e.target.closest('button[data-action]');
                if (act && act.dataset.action === 'apply') return SIOPEApp.filters.aplicar(act.dataset.target);
                if (act && act.dataset.action === 'cancel') return SIOPEApp.filters.fechar(act.dataset.target);
                
                if (!e.target.closest('th')) document.querySelectorAll('.excel-dropdown:not(.hidden)').forEach(d => SIOPEApp.filters.fechar(d.id.replace('drop_', '')));

                if (!e.target.closest('.btn-relatorio-group')) document.querySelectorAll('.relatorio-menu:not(.hidden)').forEach(m => m.classList.add('hidden'));
            });

            document.addEventListener('input', e => { if (e.target.dataset.action === 'search') SIOPEApp.filters.pesquisar(e.target.dataset.target, e.target); });
            document.addEventListener('change', e => {
                if (e.target.classList.contains('ms-select-all')) SIOPEApp.filters.toggleAll(e.target.dataset.target, e.target.checked);
                else if (e.target.classList.contains('chk-item')) SIOPEApp.filters.verificarAll(e.target.classList.toString().match(/ms-item-([^\s]+)/)[1]);
            });
        }
    },

    init() { 
        this.ui.initDataAtual(); // Acorda as datas primeiro
        this.events.init(); 
    }
};

document.addEventListener("DOMContentLoaded", () => SIOPEApp.init());