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
        fundebTotal: 1
    },

    // 2. CONFIGURAÇÕES FIXAS
    config: {
        mapaColunas: {
            'rec_NatDespesa': 'Nat.Despesa',
            'rec_Descricao': 'Descrição',
            'rec_ValorReceita': 'Valor Receita',
            'des_FuncaoSubFuncao': 'Função/SubFunção',
            'des_Vinculo': 'Vínculo',
            'des_Fonte': 'Fonte', 
            'des_ValorEmpenhado': 'Valor Empenhado',
            'des_ValorLiquidado': 'Valor Liquidado',
            'des_ValorPago': 'Valor Pago'
        }
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
                SIOPEApp.state.chartRecInst = new Chart(cxR, { type: 'doughnut', data: { labels: ['Municipal', 'União', 'Estado', 'Fundeb', 'Adicionais'], datasets: [{ data: [rp.mun.t, rp.uniao.t, rp.est.t, rp.fun.t, (rp.aplFin.t + rp.fnde.t + rp.estTra.t + rp.funET.t)], backgroundColor: ['#10b981', '#059669', '#34d399', '#0ea5e9', '#6366f1'], borderWidth: 0 }] }, options: { maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '65%' } });
            }
            
            const cxD = document.getElementById('chartDespesas');
            if(cxD && cxD.offsetParent !== null) { 
                if(SIOPEApp.state.chartDespInst) SIOPEApp.state.chartDespInst.destroy();
                SIOPEApp.state.chartDespInst = new Chart(cxD, { type: 'bar', data: { labels: ['12.122', '12.361', '12.365', '12.367'], datasets: [{ label: 'Liquidado', data: [dp.i122.l, dp.i361.l, dp.i365.l, dp.i367.l], backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(99,102,241,0.7)', 'rgba(139,92,246,0.7)', 'rgba(20,184,166,0.7)'] }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } } } });
            }
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

            // 1. Mostra ambas as telas em modo Relatório para a foto
            SIOPEApp.ui.visao('rec', 'relatorio');
            SIOPEApp.ui.visao('desp', 'relatorio');
            modRec.classList.remove('hidden');
            modDesp.classList.remove('hidden');

            // 2. Força o redesenho dos gráficos para preencher o Canvas imediatamente e remove as animações
            if (SIOPEApp.state.chartRecInst) {
                SIOPEApp.state.chartRecInst.resize();
                SIOPEApp.state.chartRecInst.update('none');
            }
            if (SIOPEApp.state.chartDespInst) {
                SIOPEApp.state.chartDespInst.resize();
                SIOPEApp.state.chartDespInst.update('none');
            }

            // 3. Aguarda o processamento de tela do navegador
            setTimeout(() => {
                if (btn) { btn.innerHTML = orig; btn.disabled = false; }
                
                // 4. Chama a impressora (PDF)
                window.print(); 

                // 5. Restaura o estado anterior
                if (recHidden) modRec.classList.add('hidden');
                if (despHidden) modDesp.classList.add('hidden');
                SIOPEApp.ui.abas(recHidden ? 'despesas' : 'receitas'); 
            }, 500);
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
                    SIOPEApp.state.receitas = SIOPEApp.utils.csvParaObj(txtR, { 'R': 'Nat.Despesa', 'K': 'Descrição', 'AB': 'Valor Receita' });
                    SIOPEApp.state.despesas = SIOPEApp.utils.csvParaObj(txtD, { 'BJ': 'Função/SubFunção', 'BW': 'Vínculo', 'AT': 'Fonte', 'L': 'Valor Empenhado', 'N': 'Valor Liquidado', 'P': 'Valor Pago' });
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

            document.getElementById('btn-visao-relatorio-rec').addEventListener('click', () => SIOPEApp.ui.visao('rec', 'relatorio'));
            document.getElementById('btn-visao-tabela-rec').addEventListener('click', () => SIOPEApp.ui.visao('rec', 'tabela'));
            document.getElementById('btn-visao-relatorio-desp').addEventListener('click', () => SIOPEApp.ui.visao('desp', 'relatorio'));
            document.getElementById('btn-visao-tabela-desp').addEventListener('click', () => SIOPEApp.ui.visao('desp', 'tabela'));

            // Direciona todos os botões de PDF e Impressão para o nosso motor preparado
            document.querySelectorAll('.btn-print, .btn-pdf').forEach(b => b.addEventListener('click', function() { SIOPEApp.exports.printReport(this) }));
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