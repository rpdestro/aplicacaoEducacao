// VARIÁVEIS E ESTADOS GLOBAIS
let dadosGlobaisReceitas = [];
let dadosGlobaisDespesas = [];
let filtrosAplicados = {};

// Instâncias Globais dos Gráficos
let chartRecInst = null;
let chartDespInst = null;

// Variáveis de paginação e FUNDEB
let limiteReceitas = 50;
let limiteDespesas = 50;
let valorTotalFundeb = 1; 

const mapaIdParaColuna = {
    'rec_NatDespesa': 'Nat.Despesa',
    'rec_Descricao': 'Descrição',
    'rec_ValorReceita': 'Valor Receita',
    'des_FuncaoSubFuncao': 'Função/SubFunção',
    'des_Vinculo': 'Vínculo',
    'des_Fonte': 'Fonte', 
    'des_ValorEmpenhado': 'Valor Empenhado',
    'des_ValorLiquidado': 'Valor Liquidado',
    'des_ValorPago': 'Valor Pago'
};

// ==========================================================================
/* FUNÇÕES DE SEGURANÇA E SANITIZAÇÃO */
// ==========================================================================
function sanitizarHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, function(tag) {
        const charsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
        return charsToReplace[tag] || tag;
    });
}

function sanitizarExportacaoExcel(valor) {
    if (typeof valor === 'string' && /^[=+\-@]/.test(valor)) return "'" + valor; 
    return valor;
}

// ==========================================================================
/* LEITURA E PROCESSAMENTO DE ARQUIVOS (MOTOR ORIGINAL RESTAURADO) */
// ==========================================================================
function lerArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = (evento) => resolve(evento.target.result);
        leitor.onerror = () => reject(new Error(`Falha ao ler o arquivo: ${arquivo.name}`));
        leitor.readAsText(arquivo, 'UTF-8');
    });
}

window.atualizarNomeArquivo = function(tipo) {
    const input = document.getElementById(`csv-${tipo}`);
    const label = document.getElementById(`label-${tipo}`);
    const sublabel = document.getElementById(`sublabel-${tipo}`) || document.querySelector(`#drop-zone-${tipo} .dropzone-subtitle`);
    const badge = document.getElementById(`badge-linhas-${tipo}`);

    if (input.files && input.files[0]) {
        const nomeArquivoSeguro = sanitizarHTML(input.files[0].name);
        const corAtiva = tipo === 'receitas' ? '#10b981' : '#dc2626'; 
        
        label.textContent = nomeArquivoSeguro;
        label.style.color = '#0f172a'; 
        if (sublabel) sublabel.innerHTML = `<span style="color: ${corAtiva}; font-weight: bold;">✓</span> <span style="color: ${corAtiva}; font-weight: 500;">${nomeArquivoSeguro} anexado</span>`;
        
        if(badge) {
            badge.classList.remove('hidden');
            badge.textContent = 'Arquivo Pronto';
        }
    }
};

function excelLetraParaIndice(letra) {
    let clean = letra.toUpperCase().trim();
    let indice = 0;
    for (let i = 0; i < clean.length; i++) indice = indice * 26 + (clean.charCodeAt(i) - 64);
    return indice - 1;
}

function converterCSVParaObjeto(textoBruto, dicionarioMapeamento) {
    const linhas = textoBruto.split('\n').map(linha => linha.trim()).filter(linha => linha !== "");
    if (linhas.length === 0) return [];

    const primeiraLinha = linhas[0];
    const separador = primeiraLinha.includes(';') ? ';' : ',';
    const cabecalhosOriginais = primeiraLinha.split(separador).map(c => c.trim().replace(/^"|"$/g, ''));
    const colunasLetras = Object.keys(dicionarioMapeamento);
    const usaLetrasComoHeader = colunasLetras.every(letra => cabecalhosOriginais.some(c => c.toUpperCase() === letra.toUpperCase()));

    return linhas.slice(1).map(linha => {
        const valores = valoresSplitComAspas(linha, separador);
        const objeto = {};
        colunasLetras.forEach(letra => {
            let idx = usaLetrasComoHeader ? cabecalhosOriginais.findIndex(c => c.toUpperCase() === letra.toUpperCase()) : excelLetraParaIndice(letra);
            const valorCelula = valores[idx] || "";
            objeto[dicionarioMapeamento[letra]] = sanitizarHTML(valorCelula);
        });
        return objeto;
    });
}

function valoresSplitComAspas(linha, separador) {
    const resultado = [];
    let dentroDeAspas = false;
    let valorAtual = "";
    for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
        if (char === '"') dentroDeAspas = !dentroDeAspas;
        else if (char === separador && !dentroDeAspas) {
            resultado.push(valorAtual.trim().replace(/^"|"$/g, ''));
            valorAtual = "";
        } else valorAtual += char;
    }
    resultado.push(valorAtual.trim().replace(/^"|"$/g, ''));
    return resultado;
}

function limparEConverterNumero(valorString) {
    if (!valorString) return 0;
    let limpo = valorString.toString().trim().replace(/[R$\s]/g, '');
    if (limpo.includes(',') && limpo.includes('.')) {
        if (limpo.indexOf('.') < limpo.indexOf(',')) limpo = limpo.replace(/\./g, '');
    } else if (limpo.includes(',') && !limpo.includes('.')) {
        limpo = limpo.replace(',', '.');
    }
    limpo = limpo.replace(',', '.');
    const numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// ==========================================================================
/* CÁLCULOS E AGRUPAMENTOS CONTÁBEIS (COM NOVO FUNDEB) */
// ==========================================================================
function processarDadosReceitas(dados) {
    let municipalItens = [], uniaoFPMItens = [], estadoItens = [], deducoesItens = [];
    let fundebItens = [], fundebMatriculasETItens = [], aplicacaoFinanceiraItens = [];
    let fndeItens = [], estadoTransferenciasItens = [];
    let municipalTotal = 0, uniaoFPMTotal = 0, estadoTotal = 0, deducoesTotal = 0;
    let fundebTotal = 0, fundebMatriculasETTotal = 0, aplicacaoFinanceiraTotal = 0;
    let fndeTotal = 0, estadoTransferenciasTotal = 0;

    const codigosAplicacao = ['1321.01.1.1.02.01', '1321.01.1.1.02.02', '1321.01.1.1.02.04', '1321.01.1.1.02.05', '1321.01.1.1.02.08', '1321.01.1.1.02.11'];
    const codigosAplicacaoClean = codigosAplicacao.map(c => c.replace(/\./g, ''));
    const codigosEstadoTransf = ['1724.51.0.1.02.00', '1724.51.0.1.03.00'];
    const codigosEstadoTransfClean = codigosEstadoTransf.map(c => c.replace(/\./g, ''));

    dados.forEach(item => {
        const nat = String(item['Nat.Despesa'] || '').trim();
        const natClean = nat.replace(/\./g, '');
        const valor = limparEConverterNumero(item['Valor Receita']);

        if (natClean.startsWith('1112') || natClean.startsWith('1113') || natClean.startsWith('1114')) { municipalItens.push(item); municipalTotal += valor; } 
        else if (natClean.startsWith('1711')) { uniaoFPMItens.push(item); uniaoFPMTotal += valor; } 
        else if (nat.startsWith('1721.50') || nat.startsWith('1721.51') || nat.startsWith('1721.52') || natClean.startsWith('172150') || natClean.startsWith('172151') || natClean.startsWith('172152')) { estadoItens.push(item); estadoTotal += valor; }

        if (natClean.startsWith('9510')) { deducoesItens.push(item); deducoesTotal += valor; }
        
        if (nat.startsWith('1751.50') || natClean.startsWith('175150') || nat.includes('1321.01.1.1.02.06') || natClean.includes('132101110206')) { fundebItens.push(item); fundebTotal += valor; }
        
        if (nat.includes('1715.53.0.1.01.00') || natClean.includes('171553010100')) { fundebMatriculasETItens.push(item); fundebMatriculasETTotal += valor; }
        
        if (codigosAplicacao.includes(nat) || codigosAplicacaoClean.includes(natClean)) { aplicacaoFinanceiraItens.push(item); aplicacaoFinanceiraTotal += valor; }
        if (nat.startsWith('1714') || natClean.startsWith('1714')) { fndeItens.push(item); fndeTotal += valor; }
        if (codigosEstadoTransf.includes(nat) || codigosEstadoTransfClean.includes(natClean)) { estadoTransferenciasItens.push(item); estadoTransferenciasTotal += valor; }
    });

    valorTotalFundeb = fundebTotal > 0 ? fundebTotal : 1; 

    const totalImpostosTransferencias = municipalTotal + uniaoFPMTotal + estadoTotal;
    const aplicacaoObrigatoria25 = totalImpostosTransferencias * 0.25;
    const absDeducoes = Math.abs(deducoesTotal);
    const aplicacaoMinimaRecursosProprios = aplicacaoObrigatoria25 - absDeducoes;
    const totalReceitasAdicionaisEnsino = aplicacaoFinanceiraTotal + fndeTotal + estadoTransferenciasTotal;

    return {
        municipal: { itens: municipalItens, total: municipalTotal },
        uniaoFPM: { itens: uniaoFPMItens, total: uniaoFPMTotal },
        estado: { itens: estadoItens, total: estadoTotal },
        totalImpostosTransferencias, aplicacaoObrigatoria25,
        deducoes: { itens: deducoesItens, total: absDeducoes }, aplicacaoMinimaRecursosProprios,
        fundeb: { itens: fundebItens, total: fundebTotal },
        fundebMatriculasET: { itens: fundebMatriculasETItens, total: fundebMatriculasETTotal },
        aplicacaoFinanceira: { itens: aplicacaoFinanceiraItens, total: aplicacaoFinanceiraTotal },
        fnde: { itens: fndeItens, total: fndeTotal },
        estadoTransferencias: { itens: estadoTransferenciasItens, total: estadoTransferenciasTotal },
        totalReceitasAdicionaisEnsino
    };
}

function processarDadosDespesas(dados) {
    const vinculosPermitidos = ['200.012', '210.000', '220.000', '240.000'];
    let info12122 = { empenhado: 0, liquidado: 0, pago: 0 };
    let info12361 = { empenhado: 0, liquidado: 0, pago: 0 };
    let info12365 = { empenhado: 0, liquidado: 0, pago: 0 };
    let info12367 = { empenhado: 0, liquidado: 0, pago: 0 };
    
    let infoVinculo261 = { empenhado: 0, liquidado: 0, pago: 0 };
    let infoVinculo262 = { empenhado: 0, liquidado: 0, pago: 0 };

    dados.forEach(item => {
        const funcSub = String(item['Função/SubFunção'] || '').trim();
        const fonteOriginal = String(item['Fonte'] || '').trim();
        const vinculo = String(item['Vínculo'] || '').trim();

        const fonteLimpa = fonteOriginal.replace(/^0+/, ''); 
        const isFonte1 = fonteLimpa === '1' || fonteLimpa.startsWith('1 ') || fonteLimpa.startsWith('1-');
        const isVinculoValid = vinculosPermitidos.some(v => vinculo.includes(v));

        const empenhado = limparEConverterNumero(item['Valor Empenhado']);
        const liquidado = limparEConverterNumero(item['Valor Liquidado']);
        const pago = limparEConverterNumero(item['Valor Pago']);

        // Filtro por Fonte 1 para Detalhamento de Subfunção
        if (isFonte1 && isVinculoValid) {
            if (funcSub.includes('12.122') || funcSub.replace(/\./g, '').includes('12122')) { info12122.empenhado += empenhado; info12122.liquidado += liquidado; info12122.pago += pago; } 
            else if (funcSub.includes('12.361') || funcSub.replace(/\./g, '').includes('12361')) { info12361.empenhado += empenhado; info12361.liquidado += liquidado; info12361.pago += pago; } 
            else if (funcSub.includes('12.365') || funcSub.replace(/\./g, '').includes('12365')) { info12365.empenhado += empenhado; info12365.liquidado += liquidado; info12365.pago += pago; } 
            else if (funcSub.includes('12.367') || funcSub.replace(/\./g, '').includes('12367')) { info12367.empenhado += empenhado; info12367.liquidado += liquidado; info12367.pago += pago; }
        }

        // Correção aplicada aqui: buscando estritamente por '261.000' e '262.000'
        if (vinculo.includes('261.000')) { infoVinculo261.empenhado += empenhado; infoVinculo261.liquidado += liquidado; infoVinculo261.pago += pago; }
        else if (vinculo.includes('262.000')) { infoVinculo262.empenhado += empenhado; infoVinculo262.liquidado += liquidado; infoVinculo262.pago += pago; }
    });

    return { info12122, info12361, info12365, info12367, infoVinculo261, infoVinculo262 };
}

// ==========================================================================
/* AÇÕES DE EXPORTAÇÃO E IMPRESSÃO */
// ==========================================================================
window.imprimirRelatorio = function() {
    if (!document.getElementById('estilo-impressao')) {
        const style = document.createElement('style');
        style.id = 'estilo-impressao';
        style.innerHTML = `
            @media print {
                body { background: white !important; }
                body * { visibility: hidden; }
                #modulo-receitas, #modulo-receitas *, #modulo-despesas, #modulo-despesas * { visibility: visible; }
                #modulo-receitas, #modulo-despesas { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; margin: 0 !important; padding: 0 !important; border: none !important; }
                button, .abas-navegacao, .btn-filtro-excel, .visao-controles { display: none !important; }
                .responsive-table, div[style*="overflow"] { overflow: visible !important; max-height: none !important; }
                .bloco-relatorio, .fundeb-card { page-break-inside: avoid; margin-bottom: 20px !important; border: 1px solid #ccc !important; }
                .bloco-cabecalho { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                canvas { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
        `;
        document.head.appendChild(style);
    }
    window.print();
};

window.exportarReceitasXLSX = function(btn) { exportarExcel('receitas', btn); };
window.exportarDespesasXLSX = function(btn) { exportarExcel('despesas', btn); };

function exportarExcel(tipo, botaoAtivador) {
    const dados = obterDadosFiltrados(tipo);
    if (dados.length === 0) return alert('Não há dados para exportar com os filtros atuais.');
    const textoOriginal = botaoAtivador.innerHTML;
    botaoAtivador.innerHTML = "⏳ Gerando...";
    botaoAtivador.disabled = true;

    const gerar = () => {
        const dadosExcel = tipo === 'receitas' 
            ? dados.map(row => ({ 'Nat.Despesa': sanitizarExportacaoExcel(row['Nat.Despesa']), 'Descrição': sanitizarExportacaoExcel(row['Descrição']), 'Valor Receita': limparEConverterNumero(row['Valor Receita']) }))
            : dados.map(row => ({ 'Função/SubFunção': sanitizarExportacaoExcel(row['Função/SubFunção']), 'Vínculo': sanitizarExportacaoExcel(row['Vínculo']), 'Fonte': sanitizarExportacaoExcel(row['Fonte']), 'Valor Empenhado': limparEConverterNumero(row['Valor Empenhado']), 'Valor Liquidado': limparEConverterNumero(row['Valor Liquidado']), 'Valor Pago': limparEConverterNumero(row['Valor Pago']) }));
        
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const colunasValores = tipo === 'receitas' ? [2] : [3, 4, 5];
            colunasValores.forEach(C => {
                const cell = ws[XLSX.utils.encode_cell({c: C, r: R})]; 
                if (cell && cell.t === 'n') cell.z = '"R$"#,##0.00;"R$"-#,##0.00'; 
            });
        }
        XLSX.utils.book_append_sheet(wb, ws, tipo === 'receitas' ? "Receitas" : "Despesas");
        XLSX.writeFile(wb, `${tipo}_filtradas.xlsx`);
        botaoAtivador.innerHTML = textoOriginal;
        botaoAtivador.disabled = false;
    };
    
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = gerar;
        script.onerror = () => { alert('Erro ao carregar biblioteca XLSX.'); botaoAtivador.innerHTML = textoOriginal; botaoAtivador.disabled = false; };
        document.head.appendChild(script);
    } else gerar();
}

window.limparTodosFiltros = function() {
    filtrosAplicados = {};
    document.querySelectorAll('.btn-filtro-excel').forEach(btn => {
        btn.classList.remove('active-filter');
        const txtBox = document.getElementById(`txt_${btn.id.replace('btn_drop_', '')}`);
        if (txtBox) txtBox.innerText = "Todos";
        sincronizarCheckboxesComEstado(btn.id.replace('btn_drop_', ''));
    });
    limiteReceitas = 50; limiteDespesas = 50;
    renderizarTabela();
};

// ==========================================================================
/* SISTEMA DE ABAS E VISÕES MODERNIZADO */
// ==========================================================================
window.alternarAba = function(aba) {
    const moduloRec = document.getElementById('modulo-receitas');
    const moduloDesp = document.getElementById('modulo-despesas');
    const btnRec = document.getElementById('btn-tab-receitas');
    const btnDesp = document.getElementById('btn-tab-despesas');
    
    const estiloBase = "flex: 1; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; text-align: center; border-radius: 8px;";
    const estiloAtivo = estiloBase + " background: white; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1);";
    const estiloInativo = estiloBase + " background: transparent; color: #64748b;";

    if (aba === 'receitas') {
        if(moduloRec) moduloRec.style.setProperty('display', 'block', 'important');
        if(moduloDesp) moduloDesp.style.setProperty('display', 'none', 'important');
        if(btnRec) btnRec.style.cssText = estiloAtivo;
        if(btnDesp) btnDesp.style.cssText = estiloInativo;
    } else {
        if(moduloRec) moduloRec.style.setProperty('display', 'none', 'important');
        if(moduloDesp) moduloDesp.style.setProperty('display', 'block', 'important');
        if(btnRec) btnRec.style.cssText = estiloInativo;
        if(btnDesp) btnDesp.style.cssText = estiloAtivo;
    }
};

window.alternarVisaoReceitas = function(visao) {
    aplicarEstilosVisao(visao, document.getElementById('container-blocos-receitas'), document.getElementById('container-tabela-receitas-wrapper'), document.getElementById('btn-visao-relatorio-rec'), document.getElementById('btn-visao-tabela-rec'));
};

window.alternarVisaoDespesas = function(visao) {
    aplicarEstilosVisao(visao, document.getElementById('container-blocos-despesas'), document.getElementById('container-tabela-despesas-wrapper'), document.getElementById('btn-visao-relatorio-desp'), document.getElementById('btn-visao-tabela-desp'));
};

function aplicarEstilosVisao(visao, blocos, tabela, btnRel, btnTab) {
    const estAtivo = "padding: 8px 16px; background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05);";
    const estInativo = "padding: 8px 16px; background-color: transparent; color: #64748b; border: 1px solid transparent; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;";
    if (visao === 'relatorio') {
        if(blocos) blocos.style.display = 'block';
        if(tabela) tabela.style.display = 'none';
        if(btnRel) btnRel.style.cssText = estAtivo;
        if(btnTab) btnTab.style.cssText = estInativo;
    } else {
        if(blocos) blocos.style.display = 'none';
        if(tabela) tabela.style.display = 'block';
        if(btnRel) btnRel.style.cssText = estInativo;
        if(btnTab) btnTab.style.cssText = estAtivo;
    }
}

// ==========================================================================
/* LÓGICA DE FILTROS E TABELAS BASE */
// ==========================================================================
window.carregarMais = function(tipo) {
    if (tipo === 'receitas') limiteReceitas += 50; else limiteDespesas += 50;
    renderizarTabela();
};

function toggleSelectAll(campo, masterCheckbox) { document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => { if(cb.closest('label').style.display !== 'none') cb.checked = masterCheckbox.checked; }); }
function verificarSelectAll(campo) {
    let todos = true;
    document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => { if(!cb.checked) todos = false; });
    const master = document.querySelector(`.ms-select-all[data-campo="${campo}"]`);
    if(master) master.checked = todos;
}
function filtrarDropdownPesquisa(campo, input) {
    const termo = input.value.toLowerCase();
    document.querySelectorAll(`#drop_${campo} .ms-item-label`).forEach(label => { label.style.display = label.textContent.toLowerCase().includes(termo) ? '' : 'none'; });
}
function atualizarTextoBotaoFiltro(campo) {
    const cbs = document.querySelectorAll(`.ms-item-${campo}`);
    const txt = document.getElementById(`txt_${campo}`);
    const btn = document.getElementById(`btn_drop_${campo}`);
    const vals = filtrosAplicados[campo];
    if (vals === undefined || vals.length === cbs.length) { if(txt) txt.innerText = "Todos"; if(btn) btn.classList.remove('active-filter'); } 
    else if (vals.length === 1) { if(txt) txt.innerText = vals[0]; if(btn) btn.classList.add('active-filter'); } 
    else { if(txt) txt.innerText = vals.length + " sel."; if(btn) btn.classList.add('active-filter'); }
}
function aplicarFiltro(campo) {
    const vals = [];
    document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => { if(cb.checked) vals.push(cb.value); });
    if (vals.length === document.querySelectorAll(`.ms-item-${campo}`).length || vals.length === 0) delete filtrosAplicados[campo]; 
    else filtrosAplicados[campo] = vals; 
    limiteReceitas = 50; limiteDespesas = 50;
    atualizarTextoBotaoFiltro(campo);
    document.getElementById(`drop_${campo}`).classList.add('hidden');
    renderizarTabela();
}
function obterDadosFiltrados(tipo) {
    const buffer = tipo === 'receitas' ? dadosGlobaisReceitas : dadosGlobaisDespesas;
    const prefix = tipo === 'receitas' ? 'rec_' : 'des_';
    return buffer.filter(reg => {
        for (let campo in filtrosAplicados) {
            if (!campo.startsWith(prefix) || filtrosAplicados[campo] === undefined) continue;
            const vals = filtrosAplicados[campo];
            if (vals.length === 0) return false;
            const linha = String(reg[mapaIdParaColuna[campo]] || '').trim().toLowerCase();
            if (!vals.some(v => linha === v.trim().toLowerCase())) return false;
        }
        return true;
    });
}
function fecharDropdownSemSalvar(campo) {
    document.getElementById(`drop_${campo}`).classList.add('hidden');
    document.querySelector(`#drop_${campo} .excel-search-input`).value = "";
    document.querySelectorAll(`#drop_${campo} .ms-item-label`).forEach(l => l.style.display = '');
    sincronizarCheckboxesComEstado(campo);
}
function sincronizarCheckboxesComEstado(campo) {
    const vals = filtrosAplicados[campo];
    const master = document.querySelector(`.ms-select-all[data-campo="${campo}"]`);
    if (vals === undefined) {
        document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => cb.checked = false);
        if (master) master.checked = false;
    } else {
        document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => { cb.checked = vals.includes(cb.value); });
        verificarSelectAll(campo);
    }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-filtro-excel');
    if (btn) {
        e.stopPropagation();
        const campoId = btn.id.replace('btn_drop_', ''); 
        const drop = btn.closest('th').querySelector('.excel-dropdown');
        document.querySelectorAll('.excel-dropdown').forEach(d => { if (d !== drop) d.classList.add('hidden'); });
        if (drop.classList.contains('hidden')) { sincronizarCheckboxesComEstado(campoId); drop.classList.remove('hidden'); } 
        else drop.classList.add('hidden');
        return;
    }
    if (!e.target.closest('th')) { document.querySelectorAll('.excel-dropdown').forEach(d => { if(!d.classList.contains('hidden')) fecharDropdownSemSalvar(d.id.replace('drop_', '')); }); }
});

function construirEstruturaTabelaBase(dados, containerId, tipo) {
    const container = document.getElementById(containerId);
    if(!container) return;
    if (!dados || dados.length === 0) { container.innerHTML = `<p class="no-data">Nenhum registro encontrado.</p>`; return; }

    const cabecalhos = Object.keys(dados[0]);
    let html = `<div class="responsive-table" style="width: 100%; overflow-x: auto; overflow-y: visible; border-radius: 12px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <table class="tabela-moderna" style="width: 100%; border-collapse: collapse; box-sizing: border-box;">
                <thead style="background-color: #f8fafc; color: #475569; border-bottom: 2px solid #cbd5e1;"><tr>`;

    cabecalhos.forEach((cabecalho, index) => {
        const campoId = Object.keys(mapaIdParaColuna).find(key => mapaIdParaColuna[key] === cabecalho);
        const valoresUnicos = [...new Set(dados.map(item => String(item[cabecalho]).trim()))].sort();
        const isValor = cabecalho.includes('Valor');
        let widthStyle = tipo === 'receitas' ? (cabecalho === 'Descrição' ? '60%' : '20%') : (cabecalho === 'Vínculo' ? '25%' : (cabecalho === 'Fonte' ? '20%' : (cabecalho === 'Função/SubFunção' ? '15%' : '13.3%')));
        const alinhamento = isValor ? 'justify-content: flex-end;' : 'justify-content: flex-start;';
        const classeMenu = (index === cabecalhos.length - 1) ? 'excel-dropdown dropdown-last-child' : 'excel-dropdown';

        html += `
            <th data-col="${cabecalho}" style="position: relative; width: ${widthStyle}; padding: 12px 16px; font-weight: 600; font-size: 13px;">
                <div class="th-container" style="display: flex; align-items: center; gap: 8px; ${alinhamento}">
                    <span>${cabecalho}</span>
                    <button id="btn_drop_${campoId}" class="btn-filtro-excel" style="background: white; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 6px; color: #475569; font-size: 11px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                         <span id="txt_${campoId}">Todos</span> 🔻
                    </button>
                </div>
                <div id="drop_${campoId}" class="${classeMenu} hidden" style="position: absolute; top: 100%; left: 0; z-index: 99999; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); width: 280px; padding: 12px; text-align: left; font-weight: 400; margin-top: 4px; color: #334155;">
                    <input type="text" class="excel-search-input" oninput="filtrarDropdownPesquisa('${campoId}', this)" placeholder="Pesquisar..." style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; box-sizing: border-box; margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 4px 0; cursor: pointer; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px;">
                        <input type="checkbox" class="ms-select-all" data-campo="${campoId}" onchange="toggleSelectAll('${campoId}', this)"> Selecionar Tudo
                    </label>
                    <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
                        ${valoresUnicos.map(val => `<label class="ms-item-label" style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; cursor: pointer;"><input type="checkbox" class="chk-item ms-item-${campoId}" value="${val.replace(/"/g, '&quot;')}" onchange="verificarSelectAll('${campoId}')" style="margin-top: 2px;"> <span style="word-break: break-word;">${val || '(Vazio)'}</span></label>`).join('')}
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                        <button onclick="aplicarFiltro('${campoId}')" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">OK</button>
                        <button onclick="fecharDropdownSemSalvar('${campoId}')" style="padding: 6px 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Cancelar</button>
                    </div>
                </div>
            </th>`;
    });

    html += `</tr></thead><tbody id="tbody_rows_${tipo}"></tbody></table></div>`;
    html += `<div id="container_btn_mais_${tipo}" style="text-align: center; margin-top: 24px; display: none;"><button onclick="carregarMais('${tipo}')" style="padding: 10px 24px; background: white; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;">Carregar mais 50 registros...</button></div>`;
    container.innerHTML = html;
}

// ==========================================================================
/* RENDERIZAÇÃO VISUAL DOS BLOCOS E GRÁFICOS */
// ==========================================================================
function carregarChartJS(callback) {
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = callback;
        script.onerror = () => console.error("Falha ao carregar o Chart.js");
        document.head.appendChild(script);
    } else {
        callback();
    }
}

function gerarBlocoRelatorio(titulo, total, itens, corDestaque = '#10b981', corFundoClaro = '#ecfdf5') {
    const itensHTML = itens && itens.length > 0 ? itens.map(item => `
        <tr style="border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s;">
            <td style="padding: 10px 16px; font-family: 'Consolas', monospace; font-size: 13px; color: #475569; width: 220px;">${item['Nat.Despesa'] || ''}</td>
            <td style="padding: 10px 16px; font-size: 13px; color: #1e293b;">${item['Descrição'] || ''}</td>
            <td style="padding: 10px 16px; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; font-size: 13px; color: #0f172a; width: 160px; white-space: nowrap;">${formatarMoeda(limparEConverterNumero(item['Valor Receita']))}</td>
        </tr>`).join('') : `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #94a3b8; font-size: 13px; font-style: italic;">Nenhum lançamento encontrado para esta regra.</td></tr>`;
    
    return `
        <div class="bloco-relatorio" style="margin-bottom: 24px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden;">
            <div class="bloco-cabecalho" style="background-color: ${corFundoClaro}; border-left: 4px solid ${corDestaque}; border-bottom: 1px solid #e2e8f0; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: #0f172a; font-size: 14px; letter-spacing: -0.3px;">${titulo}</span>
                <span style="font-weight: 700; color: ${corDestaque}; font-size: 16px; font-family: 'Consolas', monospace;">${formatarMoeda(total)}</span>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;"><tbody>${itensHTML}</tbody></table>
            </div>
        </div>`;
}

function gerarBlocoRelatorioDespesas(titulo, objDados, corDestaque = '#3b82f6', corFundoClaro = '#eff6ff') {
    return `
        <div class="bloco-relatorio" style="margin-bottom: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.05); display: flex; align-items: stretch; overflow: hidden;">
            <div class="bloco-cabecalho" style="background-color: ${corFundoClaro}; border-left: 4px solid ${corDestaque}; color: #0f172a; padding: 16px 20px; font-weight: 600; font-size: 14px; display: flex; align-items: center; width: 180px; flex-shrink: 0; border-right: 1px solid #e2e8f0;">
                ${titulo}
            </div>
            <div style="padding: 12px 20px; display: flex; justify-content: flex-end; align-items: center; gap: 24px; font-size: 14px; flex-grow: 1; background: white;">
                <div style="color: #64748b; width: 220px; text-align: right; font-size: 13px;">Empenhado: <br><strong style="color: #1e293b; font-family: 'Consolas', monospace; font-size: 15px;">${formatarMoeda(objDados.empenhado)}</strong></div>
                <div style="color: #64748b; width: 220px; text-align: right; font-size: 13px;">Liquidado: <br><strong style="color: #1e293b; font-family: 'Consolas', monospace; font-size: 15px;">${formatarMoeda(objDados.liquidado)}</strong></div>
                <div style="color: #64748b; width: 220px; text-align: right; font-size: 13px;">Pago: <br><strong style="color: ${corDestaque}; font-family: 'Consolas', monospace; font-size: 15px;">${formatarMoeda(objDados.pago)}</strong></div>
            </div>
        </div>`;
}

function desenharGraficosDinamicos(recProc, despProc) {
    carregarChartJS(() => {
        // --- GRÁFICO DE RECEITAS ---
        const ctxRec = document.getElementById('chartReceitas');
        if (ctxRec) {
            if (chartRecInst) chartRecInst.destroy();
            chartRecInst = new Chart(ctxRec, {
                type: 'doughnut',
                data: {
                    labels: ['Municipal', 'União (FPM)', 'Estado', 'Fundeb Principal', 'Outras Adicionais'],
                    datasets: [{
                        data: [
                            recProc.municipal.total,
                            recProc.uniaoFPM.total,
                            recProc.estado.total,
                            recProc.fundeb.total,
                            (recProc.aplicacaoFinanceira.total + recProc.fnde.total + recProc.estadoTransferencias.total + recProc.fundebMatriculasET.total)
                        ],
                        backgroundColor: ['#10b981', '#059669', '#34d399', '#0ea5e9', '#6366f1'],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { font: { family: 'Inter', size: 12 }, color: '#475569', usePointStyle: true, padding: 20 } },
                        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, callbacks: { label: function(context) { return ' ' + formatarMoeda(context.raw); } } }
                    },
                    cutout: '65%'
                }
            });
        }

        // --- GRÁFICO DE DESPESAS ---
        const ctxDesp = document.getElementById('chartDespesas');
        if (ctxDesp) {
            if (chartDespInst) chartDespInst.destroy();
            chartDespInst = new Chart(ctxDesp, {
                type: 'bar',
                data: {
                    labels: ['12.122 (Admin)', '12.361 (Fundamental)', '12.365 (Infantil)', '12.367 (Especial)'],
                    datasets: [{
                        label: 'Liquidado (R$)',
                        data: [despProc.info12122.liquidado, despProc.info12361.liquidado, despProc.info12365.liquidado, despProc.info12367.liquidado],
                        backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(99, 102, 241, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(20, 184, 166, 0.7)'],
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    });
}

function renderizarTabela() {
    const dataAtual = new Date();
    const textoReferencia = `${dataAtual.toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}/${dataAtual.getFullYear()}`;
    
    // CABEÇALHO OFICIAL MODERNIZADO COM LOGO
    const cabecalhoOficial = `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 20px; margin-bottom: 32px; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.03); text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #0284c7, #10b981);"></div>
            
            <!-- INÍCIO DO LOGOTIPO -->
            <img src="./brasao.png" 
                 alt="Brasão da Prefeitura" 
                 style="height: 85px; width: auto; margin-bottom: 16px; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            <!-- FIM DO LOGOTIPO -->

            <h2 style="margin: 0 0 4px 0; font-size: 1.15rem; color: #0f172a; font-weight: 700; letter-spacing: -0.5px;">PREFEITURA MUNICIPAL DE BOTUCATU</h2>
            <h3 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #475569; font-weight: 600;">SECRETARIA MUNICIPAL DA FAZENDA</h3>
            <p style="margin: 0 0 24px 0; font-size: 0.85rem; color: #64748b;">Departamento de Planejamento e Orçamento (LDO/SIOPS)</p>
            
            <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; color: #475569;">
                    Referência: <strong style="color: #0f172a;">${textoReferencia}</strong>
                </div>
                <div style="background: #f0fdf4; border: 1px solid #a7f3d0; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #047857;">
                    Manutenção e Desenvolvimento do Ensino (Art. 212 - CF)
                </div>
            </div>
        </div>
    `;

    // ---------------- RECEITAS ----------------
    const receitasFiltradas = obterDadosFiltrados('receitas');
    const tbodyRec = document.getElementById('tbody_rows_receitas');
    const containerBtnMaisRec = document.getElementById('container_btn_mais_receitas');

    if (tbodyRec) {
        tbodyRec.innerHTML = receitasFiltradas.slice(0, limiteReceitas).map(item => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 16px; font-family: 'Consolas', monospace; font-size: 13px; color: #475569;">${item['Nat.Despesa']}</td>
                <td style="padding: 12px 16px; font-size: 13px; color: #1e293b;">${item['Descrição']}</td>
                <td style="padding: 12px 16px; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; font-size: 13px; color: #0f172a;">${formatarMoeda(limparEConverterNumero(item['Valor Receita']))}</td>
            </tr>
        `).join('');
        if (containerBtnMaisRec) containerBtnMaisRec.style.display = receitasFiltradas.length > limiteReceitas ? 'block' : 'none';
    }

    const recProc = processarDadosReceitas(receitasFiltradas);
    const containerBlocosRec = document.getElementById('container-blocos-receitas');
    if (containerBlocosRec) {
        containerBlocosRec.innerHTML = cabecalhoOficial + `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.03); display: flex; flex-wrap: wrap; gap: 24px; align-items: center; justify-content: space-around;">
                <div style="width: 100%; max-width: 450px; height: 250px;">
                    <canvas id="chartReceitas"></canvas>
                </div>
                <div style="flex: 1; min-width: 300px; padding: 0 15px;">
                    <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 1.15rem;">Composição das Receitas de Ensino</h4>
                    <p style="color: #64748b; font-size: 0.9rem; line-height: 1.6; margin: 0;">O gráfico ilustra a distribuição percentual das principais fontes de recursos destinados à educação neste período.</p>
                </div>
            </div>

            <div style="margin: 30px 0 16px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                <h4 style="margin: 0; color: #0f172a; font-size: 1.1rem;">Impostos e Transferências</h4>
            </div>
            ${gerarBlocoRelatorio('MUNICIPAL (Col. R: 1112, 1113, 1114)', recProc.municipal.total, recProc.municipal.itens, '#10b981', '#f0fdf4')}
            ${gerarBlocoRelatorio('UNIÃO - FPM (Col. R: 1711)', recProc.uniaoFPM.total, recProc.uniaoFPM.itens, '#059669', '#ecfdf5')}
            ${gerarBlocoRelatorio('ESTADO (Col. R: 1721.50, .51, .52)', recProc.estado.total, recProc.estado.itens, '#34d399', '#f0fdf4')}
            
            <div style="background: linear-gradient(to right, #0f172a, #1e293b); color: white; padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                <span style="font-weight: 600; font-size: 14px;">TOTAL DE IMPOSTOS E TRANSFERÊNCIAS</span>
                <span style="font-weight: 700; font-size: 18px; font-family: 'Consolas', monospace;">${formatarMoeda(recProc.totalImpostosTransferencias)}</span>
            </div>

            ${gerarBlocoRelatorio('APLICAÇÃO OBRIGATÓRIA (25%)', recProc.aplicacaoObrigatoria25, [], '#0284c7', '#f0f9ff')}
            ${gerarBlocoRelatorio('DEDUÇÕES PARA FORMAÇÃO - FUNDEB (Col. R: 9510)', recProc.deducoes.total, recProc.deducoes.itens, '#f59e0b', '#fffbeb')}
            
            <div style="background: linear-gradient(to right, #4338ca, #4f46e5); color: white; padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                <span style="font-weight: 600; font-size: 14px;">APLICAÇÃO MÍNIMA OBRIGATÓRIA - RECURSOS PRÓPRIOS</span>
                <span style="font-weight: 700; font-size: 18px; font-family: 'Consolas', monospace;">${formatarMoeda(recProc.aplicacaoMinimaRecursosProprios)}</span>
            </div>

            <div style="margin: 30px 0 16px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                <h4 style="margin: 0; color: #0f172a; font-size: 1.1rem;">Fundeb e Receitas Adicionais</h4>
            </div>
            
            ${gerarBlocoRelatorio('FUNDEB PRINCIPAL (Col. R: 1751.50... / 1321.01...)', recProc.fundeb.total, recProc.fundeb.itens, '#0ea5e9', '#f0f9ff')}
            ${gerarBlocoRelatorio('TRANSFERÊNCIA RECURSOS FUNDEB DESTINADOS CRIAÇÃO MATRÍCULAS E.T', recProc.fundebMatriculasET.total, recProc.fundebMatriculasET.itens, '#0284c7', '#f0f9ff')}
            
            ${gerarBlocoRelatorio('RECEITA DA APLICAÇÃO FINANCEIRA', recProc.aplicacaoFinanceira.total, recProc.aplicacaoFinanceira.itens, '#0284c7', '#f0f9ff')}
            ${gerarBlocoRelatorio('TRANSFERÊNCIAS DO FNDE', recProc.fnde.total, recProc.fnde.itens, '#0284c7', '#f0f9ff')}
            ${gerarBlocoRelatorio('TRANSFERÊNCIAS DO ESTADO (Ensino)', recProc.estadoTransferencias.total, recProc.estadoTransferencias.itens, '#0284c7', '#f0f9ff')}
            
            <div style="background: linear-gradient(to right, #0284c7, #0369a1); color: white; padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                <span style="font-weight: 600; font-size: 14px;">RECEITAS ADICIONAIS PARA O FINANCIAMENTO DO ENSINO</span>
                <span style="font-weight: 700; font-size: 18px; font-family: 'Consolas', monospace;">${formatarMoeda(recProc.totalReceitasAdicionaisEnsino)}</span>
            </div>
        `;
    }

    // ---------------- DESPESAS ----------------
    const despesasFiltradas = obterDadosFiltrados('despesas');
    const tbodyDesp = document.getElementById('tbody_rows_despesas');
    const containerBtnMaisDesp = document.getElementById('container_btn_mais_despesas');

    if (tbodyDesp) {
        tbodyDesp.innerHTML = despesasFiltradas.slice(0, limiteDespesas).map(item => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 16px; font-family: 'Consolas', monospace; font-size: 13px; color: #475569;">${item['Função/SubFunção']}</td>
                <td style="padding: 12px 16px; font-size: 13px; color: #1e293b;">${item['Vínculo']}</td>
                <td style="padding: 12px 16px; font-family: 'Consolas', monospace; font-size: 13px; color: #475569; text-align: center;">${item['Fonte']}</td>
                <td style="padding: 12px 16px; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; font-size: 13px;">${formatarMoeda(limparEConverterNumero(item['Valor Empenhado']))}</td>
                <td style="padding: 12px 16px; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; font-size: 13px;">${formatarMoeda(limparEConverterNumero(item['Valor Liquidado']))}</td>
                <td style="padding: 12px 16px; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; font-size: 13px; color: #0284c7;">${formatarMoeda(limparEConverterNumero(item['Valor Pago']))}</td>
            </tr>
        `).join('');
        if (containerBtnMaisDesp) containerBtnMaisDesp.style.display = despesasFiltradas.length > limiteDespesas ? 'block' : 'none';
    }

    const despProc = processarDadosDespesas(despesasFiltradas);
    const baseAplicacaoMinima = recProc.aplicacaoMinimaRecursosProprios;
    
    const tEmp = despProc.info12122.empenhado + despProc.info12361.empenhado + despProc.info12365.empenhado + despProc.info12367.empenhado;
    const tLiq = despProc.info12122.liquidado + despProc.info12361.liquidado + despProc.info12365.liquidado + despProc.info12367.liquidado;
    const tPag = despProc.info12122.pago + despProc.info12361.pago + despProc.info12365.pago + despProc.info12367.pago;

    const pEmp = baseAplicacaoMinima > 0 ? ((tEmp * 25) / baseAplicacaoMinima).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';
    const pLiq = baseAplicacaoMinima > 0 ? ((tLiq * 25) / baseAplicacaoMinima).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';
    const pPag = baseAplicacaoMinima > 0 ? ((tPag * 25) / baseAplicacaoMinima).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';

    // ---------------- CÁLCULOS MATRIZ FUNDEB ----------------
    // Totais Absolutos
    const tFundebEmp = despProc.infoVinculo261.empenhado + despProc.infoVinculo262.empenhado;
    const tFundebLiq = despProc.infoVinculo261.liquidado + despProc.infoVinculo262.liquidado;
    const tFundebPag = despProc.infoVinculo261.pago + despProc.infoVinculo262.pago;

    // Percentuais (Cálculo Reverso sobre a Receita Arrecadada)
    const calcPct = (v) => valorTotalFundeb > 0 ? ((v / valorTotalFundeb) * 100) : 0;
    const fmtPct = (p) => p.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';

    const containerBlocosDesp = document.getElementById('container-blocos-despesas');
    if (containerBlocosDesp) {
        containerBlocosDesp.innerHTML = cabecalhoOficial + `
            
            <!-- NOVA MATRIZ FUNDEB 261/262 (Estilo Tabela Excel) -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700;">Acompanhamento do FUNDEB (Vínculos 261.0000 e 262.0000)</h3>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #ffffff; color: #475569; font-weight: bold; border-bottom: 1px solid #cbd5e1; text-align: center;">
                                <th style="padding: 12px; border-right: 1px solid #e2e8f0;" colspan="2">VÍNCULO</th>
                                <th style="padding: 12px; text-align: right;">EMPENHADO</th>
                                <th style="padding: 12px; text-align: right;">LIQUIDADO</th>
                                <th style="padding: 12px; text-align: right;">PAGO</th>
                            </tr>
                        </thead>
                        <tbody style="font-family: 'Consolas', monospace; text-align: right;">
                            
                            <!-- Valores Absolutos -->
                            <tr style="border-bottom: 1px solid #f1f5f9; color: #1e293b;">
                                <td style="padding: 10px; border-right: 1px solid #e2e8f0; text-align: center;" colspan="2">02.261.0000</td>
                                <td style="padding: 10px;">${formatarMoeda(despProc.infoVinculo261.empenhado)}</td>
                                <td style="padding: 10px;">${formatarMoeda(despProc.infoVinculo261.liquidado)}</td>
                                <td style="padding: 10px;">${formatarMoeda(despProc.infoVinculo261.pago)}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #cbd5e1; color: #1e293b;">
                                <td style="padding: 10px; border-right: 1px solid #e2e8f0; text-align: center;" colspan="2">02.262.0000</td>
                                <td style="padding: 10px;">${formatarMoeda(despProc.infoVinculo262.empenhado)}</td>
                                <td style="padding: 10px;">${formatarMoeda(despProc.infoVinculo262.liquidado)}</td>
                                <td style="padding: 10px;">${formatarMoeda(despProc.infoVinculo262.pago)}</td>
                            </tr>
                            <tr style="background-color: #93c5fd; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                                <td style="padding: 10px; text-align: center; border-right: 1px solid #60a5fa;" colspan="2">TOTAL</td>
                                <td style="padding: 10px;">${formatarMoeda(tFundebEmp)}</td>
                                <td style="padding: 10px;">${formatarMoeda(tFundebLiq)}</td>
                                <td style="padding: 10px;">${formatarMoeda(tFundebPag)}</td>
                            </tr>
                            
                            <!-- Percentuais -->
                            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                                <td rowspan="2" style="padding: 10px; font-weight: bold; color: #475569; vertical-align: middle; text-align: center; border-right: 1px solid #e2e8f0; width: 140px; font-family: 'Inter', sans-serif;">PERCENTUAL</td>
                                <td style="padding: 10px; text-align: left; border-right: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-weight: 600; color: #334155;">
                                    261.0000 <br><span style="font-size: 11px; color: #64748b; font-weight: 500;">(Mínimo 70%)</span>
                                </td>
                                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${fmtPct(calcPct(despProc.infoVinculo261.empenhado))}</td>
                                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${fmtPct(calcPct(despProc.infoVinculo261.liquidado))}</td>
                                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${fmtPct(calcPct(despProc.infoVinculo261.pago))}</td>
                            </tr>
                            <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                                <td style="padding: 10px; text-align: left; border-right: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-weight: 600; color: #334155;">
                                    262.0000 <span style="font-size: 11px; color: #64748b; font-weight: 500;">(Máximo 30%)</span>
                                </td>
                                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${fmtPct(calcPct(despProc.infoVinculo262.empenhado))}</td>
                                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${fmtPct(calcPct(despProc.infoVinculo262.liquidado))}</td>
                                <td style="padding: 10px; font-weight: bold; color: #1e293b;">${fmtPct(calcPct(despProc.infoVinculo262.pago))}</td>
                            </tr>
                            <tr style="background-color: #93c5fd; font-weight: bold; color: #1e3a8a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                                <td style="padding: 10px; text-align: center; border-right: 1px solid #60a5fa;" colspan="2">TOTAL</td>
                                <td style="padding: 10px;">${fmtPct(calcPct(tFundebEmp))}</td>
                                <td style="padding: 10px;">${fmtPct(calcPct(tFundebLiq))}</td>
                                <td style="padding: 10px;">${fmtPct(calcPct(tFundebPag))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- CARD DO GRÁFICO DE DESPESAS -->
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 32px; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.03); display: flex; flex-wrap: wrap; gap: 24px; align-items: center; justify-content: space-around;">
                <div style="width: 100%; max-width: 450px; height: 250px;">
                    <canvas id="chartDespesas"></canvas>
                </div>
                <div style="flex: 1; min-width: 300px; padding: 0 15px;">
                    <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 1.15rem;">Distribuição das Despesas (Valores Liquidados)</h4>
                    <p style="color: #64748b; font-size: 0.9rem; line-height: 1.6; margin: 0;">Análise da alocação de recursos por subfunção educacional na Fonte 1.</p>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 24px; border-radius: 16px; margin-bottom: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                <h3 style="margin: 0 0 20px 0; font-size: 15px; text-transform: uppercase; text-align: center; color: #94a3b8; letter-spacing: 1px; font-weight: 600;">Resumo da Aplicação Obrigatória (25%)</h3>
                <div style="display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 12px;">
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Empenhado</div>
                        <div style="font-size: 15px; font-family: 'Consolas', monospace; color: #e2e8f0; margin-bottom: 4px;">${formatarMoeda(tEmp)}</div>
                        <div style="font-size: 24px; font-weight: 800; color: #38bdf8;">${pEmp}%</div>
                    </div>
                    <div style="flex: 1; min-width: 200px; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 12px;">
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Liquidado</div>
                        <div style="font-size: 15px; font-family: 'Consolas', monospace; color: #e2e8f0; margin-bottom: 4px;">${formatarMoeda(tLiq)}</div>
                        <div style="font-size: 24px; font-weight: 800; color: #34d399;">${pLiq}%</div>
                    </div>
                    <div style="flex: 1; min-width: 200px; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 12px;">
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Pago</div>
                        <div style="font-size: 15px; font-family: 'Consolas', monospace; color: #e2e8f0; margin-bottom: 4px;">${formatarMoeda(tPag)}</div>
                        <div style="font-size: 24px; font-weight: 800; color: #a3e635;">${pPag}%</div>
                    </div>
                </div>
            </div>

            <div style="margin: 30px 0 16px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                <h4 style="margin: 0; color: #0f172a; font-size: 1.1rem;">Detalhamento por Função/Subfunção (Fonte 1)</h4>
            </div>
            ${gerarBlocoRelatorioDespesas('12.122 - Admin. Geral', despProc.info12122, '#3b82f6', '#eff6ff')}
            ${gerarBlocoRelatorioDespesas('12.361 - Ensino Fund.', despProc.info12361, '#6366f1', '#eef2ff')}
            ${gerarBlocoRelatorioDespesas('12.365 - Educ. Infantil', despProc.info12365, '#8b5cf6', '#f5f3ff')}
            ${gerarBlocoRelatorioDespesas('12.367 - Educ. Especial', despProc.info12367, '#14b8a6', '#f0fdfa')}
        `;
    }

    desenharGraficosDinamicos(recProc, despProc);
}

// ==========================================================================
/* INJEÇÃO DA INTERFACE PRINCIPAL */
// ==========================================================================
document.getElementById('btn-processar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-processar');
    const inputReceitas = document.getElementById('csv-receitas').files[0];
    const inputDespesas = document.getElementById('csv-despesas').files[0];

    if (!inputReceitas || !inputDespesas) { alert('Por favor, selecione os dois arquivos antes de continuar.'); return; }

    const textoOriginal = btn.innerHTML;
    btn.innerHTML = "⏳ Processando...";
    btn.disabled = true;

    try {
        const [textoReceitas, textoDespesas] = await Promise.all([lerArquivo(inputReceitas), lerArquivo(inputDespesas)]);
        
        // Mapeamentos exatos preservados do script original
        const mapeamentoReceitas = { 'R': 'Nat.Despesa', 'K': 'Descrição', 'AB': 'Valor Receita' };
        const mapeamentoDespesas = { 'BJ': 'Função/SubFunção', 'BW': 'Vínculo', 'AT': 'Fonte', 'L': 'Valor Empenhado', 'N': 'Valor Liquidado', 'P': 'Valor Pago' };

        dadosGlobaisReceitas = converterCSVParaObjeto(textoReceitas, mapeamentoReceitas);
        dadosGlobaisDespesas = converterCSVParaObjeto(textoDespesas, mapeamentoDespesas);

        filtrosAplicados = {}; limiteReceitas = 50; limiteDespesas = 50;

        const dashboard = document.getElementById('dashboard');
        dashboard.classList.remove('hidden');
        dashboard.style.cssText = "width: 100%; max-width: 1300px; margin: 0 auto; padding: 0; box-sizing: border-box;";

        document.getElementById('resultado-status').innerHTML = `
            <!-- Segmented Control para Abas -->
            <div style="background: #f1f5f9; padding: 6px; border-radius: 12px; display: flex; width: 100%; max-width: 400px; margin: 0 auto 32px auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                <button id="btn-tab-receitas" onclick="alternarAba('receitas')" style="flex: 1; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; text-align: center; border-radius: 8px; background: white; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">Receitas</button>
                <button id="btn-tab-despesas" onclick="alternarAba('despesas')" style="flex: 1; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; text-align: center; border-radius: 8px; background: transparent; color: #64748b;">Despesas</button>
            </div>

            <!-- MODULO DE RECEITAS -->
            <div id="modulo-receitas" style="width: 100%; box-sizing: border-box; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <div class="visao-controles" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; gap: 8px; background: #f8fafc; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <button id="btn-visao-relatorio-rec" onclick="alternarVisaoReceitas('relatorio')" style="padding: 8px 16px; background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">📊 Relatório Executivo</button>
                        <button id="btn-visao-tabela-rec" onclick="alternarVisaoReceitas('tabela')" style="padding: 8px 16px; background-color: transparent; color: #64748b; border: 1px solid transparent; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">📋 Base de Dados</button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="imprimirRelatorio()" style="padding: 8px 16px; background: white; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">🖨️ Imprimir</button>
                        <button onclick="exportarReceitasXLSX(this)" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">⬇️ Excel (XLSX)</button>
                        <button onclick="limparTodosFiltros()" style="padding: 8px 16px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Limpar Filtros</button>
                    </div>
                </div>
                <div id="container-blocos-receitas" style="display: block;"></div>
                <div id="container-tabela-receitas-wrapper" style="display: none;"><div id="nova-tabela-receitas"></div></div>
            </div>

            <!-- MODULO DE DESPESAS -->
            <div id="modulo-despesas" style="width: 100%; box-sizing: border-box; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; display: none;">
                <div class="visao-controles" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; gap: 8px; background: #f8fafc; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <button id="btn-visao-relatorio-desp" onclick="alternarVisaoDespesas('relatorio')" style="padding: 8px 16px; background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">📊 Relatório Executivo</button>
                        <button id="btn-visao-tabela-desp" onclick="alternarVisaoDespesas('tabela')" style="padding: 8px 16px; background-color: transparent; color: #64748b; border: 1px solid transparent; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">📋 Base de Dados</button>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="imprimirRelatorio()" style="padding: 8px 16px; background: white; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">🖨️ Imprimir</button>
                        <button onclick="exportarDespesasXLSX(this)" style="padding: 8px 16px; background: #0284c7; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);">⬇️ Excel (XLSX)</button>
                        <button onclick="limparTodosFiltros()" style="padding: 8px 16px; background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Limpar Filtros</button>
                    </div>
                </div>
                <div id="container-blocos-despesas" style="display: block;"></div>
                <div id="container-tabela-despesas-wrapper" style="display: none;"><div id="nova-tabela-despesas"></div></div>
            </div>
        `;

        construirEstruturaTabelaBase(dadosGlobaisReceitas, 'nova-tabela-receitas', 'receitas');
        construirEstruturaTabelaBase(dadosGlobaisDespesas, 'nova-tabela-despesas', 'despesas');
        renderizarTabela();
        
        document.getElementById('upload-section').style.display = 'none';
        alternarAba('receitas');

    } catch (erro) {
        console.error(erro);
        alert(`Erro durante o processamento: ${erro.message}`);
    } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
});