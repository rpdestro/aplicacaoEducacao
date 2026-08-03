// VARIÁVEIS E ESTADOS GLOBAIS
let dadosGlobaisReceitas = [];
let dadosGlobaisDespesas = [];
let filtrosAplicados = {};

// Variáveis de paginação (Limites iniciais de linhas na tela)
let limiteReceitas = 50;
let limiteDespesas = 50;

// Dicionário para traduzir os IDs seguros do DOM de volta para as chaves reais das colunas
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

// 1. Função auxiliar para ler um arquivo
function lerArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = (evento) => resolve(evento.target.result);
        leitor.onerror = () => reject(new Error(`Falha ao ler o arquivo: ${arquivo.name}`));
        leitor.readAsText(arquivo, 'UTF-8');
    });
}

// Atualiza o visual do card quando o arquivo for selecionado na tela de upload
window.atualizarNomeArquivo = function(tipo) {
    const input = document.getElementById(`csv-${tipo}`);
    const label = document.getElementById(`label-${tipo}`);
    const sublabel = document.getElementById(`sublabel-${tipo}`);
    const badge = document.getElementById(`badge-linhas-${tipo}`);

    if (input.files && input.files[0]) {
        const nomeArquivo = input.files[0].name;
        const corAtiva = tipo === 'receitas' ? '#16a34a' : '#dc2626'; 
        
        label.textContent = nomeArquivo;
        label.style.color = '#374151'; 
        sublabel.innerHTML = `<span style="color: ${corAtiva}; font-weight: bold;">✓</span> <span style="color: ${corAtiva}; font-weight: 500;">${nomeArquivo} anexado</span>`;
        
        if(badge) {
            badge.classList.remove('hidden');
            badge.textContent = 'Arquivo Pronto';
        }
    }
};

function excelLetraParaIndice(letra) {
    let clean = letra.toUpperCase().trim();
    let indice = 0;
    for (let i = 0; i < clean.length; i++) {
        indice = indice * 26 + (clean.charCodeAt(i) - 64);
    }
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
            let idx = -1;
            if (usaLetrasComoHeader) idx = cabecalhosOriginais.findIndex(c => c.toUpperCase() === letra.toUpperCase());
            else idx = excelLetraParaIndice(letra);

            const valorCelula = valores[idx] || "";
            const novoNomeColuna = dicionarioMapeamento[letra];
            objeto[novoNomeColuna] = valorCelula;
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
/* CÁLCULOS E AGRUPAMENTOS CONTÁBEIS - RECEITAS */
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
        if (nat.includes('1751.50.0.1.00.00') || natClean.includes('175150010000') || nat.includes('1321.01.1.1.02.06') || natClean.includes('132101110206')) { fundebItens.push(item); fundebTotal += valor; }
        if (nat.includes('1715.53.0.1.01.00') || natClean.includes('171553010100')) { fundebMatriculasETItens.push(item); fundebMatriculasETTotal += valor; }
        if (codigosAplicacao.includes(nat) || codigosAplicacaoClean.includes(natClean)) { aplicacaoFinanceiraItens.push(item); aplicacaoFinanceiraTotal += valor; }
        if (nat.startsWith('1714') || natClean.startsWith('1714')) { fndeItens.push(item); fndeTotal += valor; }
        if (codigosEstadoTransf.includes(nat) || codigosEstadoTransfClean.includes(natClean)) { estadoTransferenciasItens.push(item); estadoTransferenciasTotal += valor; }
    });

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

// ==========================================================================
/* CÁLCULOS E AGRUPAMENTOS CONTÁBEIS - DESPESAS */
// ==========================================================================
function processarDadosDespesas(dados) {
    const vinculosPermitidos = ['200.012', '210.000', '220.000', '240.000'];
    
    let info12122 = { empenhado: 0, liquidado: 0, pago: 0 };
    let info12361 = { empenhado: 0, liquidado: 0, pago: 0 };
    let info12365 = { empenhado: 0, liquidado: 0, pago: 0 };
    let info12367 = { empenhado: 0, liquidado: 0, pago: 0 };

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

        if (isFonte1 && isVinculoValid) {
            if (funcSub.includes('12.122') || funcSub.replace(/\./g, '').includes('12122')) {
                info12122.empenhado += empenhado;
                info12122.liquidado += liquidado;
                info12122.pago += pago;
            } else if (funcSub.includes('12.361') || funcSub.replace(/\./g, '').includes('12361')) {
                info12361.empenhado += empenhado;
                info12361.liquidado += liquidado;
                info12361.pago += pago;
            } else if (funcSub.includes('12.365') || funcSub.replace(/\./g, '').includes('12365')) {
                info12365.empenhado += empenhado;
                info12365.liquidado += liquidado;
                info12365.pago += pago;
            } else if (funcSub.includes('12.367') || funcSub.replace(/\./g, '').includes('12367')) {
                info12367.empenhado += empenhado;
                info12367.liquidado += liquidado;
                info12367.pago += pago;
            }
        }
    });

    return { info12122, info12361, info12365, info12367 };
}

// ==========================================================================
/* AÇÕES DE EXPORTAÇÃO E IMPRESSÃO E LIMPEZA DE FILTROS */
// ==========================================================================

window.imprimirRelatorio = function() {
    if (!document.getElementById('estilo-impressao')) {
        const style = document.createElement('style');
        style.id = 'estilo-impressao';
        style.innerHTML = `
            @media print {
                body * { visibility: hidden; }
                #modulo-receitas, #modulo-receitas *, #modulo-despesas, #modulo-despesas * { visibility: visible; }
                #modulo-receitas, #modulo-despesas { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; background: white !important; margin: 0 !important; padding: 0 !important; }
                button, .abas-navegacao, .btn-filtro-excel { display: none !important; }
                .responsive-table, div[style*="overflow"] { overflow: visible !important; max-height: none !important; }
            }
        `;
        document.head.appendChild(style);
    }
    window.print();
};

window.exportarReceitasXLSX = function(botaoAtivador) {
    const receitasFiltradas = obterDadosFiltrados('receitas');
    if (receitasFiltradas.length === 0) return alert('Não há dados de receitas para exportar com os filtros atuais.');
    const textoOriginal = botaoAtivador.innerHTML;
    botaoAtivador.innerHTML = "⏳ Gerando...";
    botaoAtivador.disabled = true;

    const gerar = () => {
        const dadosExcel = receitasFiltradas.map(row => ({
            'Nat.Despesa': row['Nat.Despesa'], 'Descrição': row['Descrição'], 'Valor Receita': limparEConverterNumero(row['Valor Receita']) 
        }));
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cell = ws[XLSX.utils.encode_cell({c: 2, r: R})]; 
            if (cell && cell.t === 'n') cell.z = '"R$"#,##0.00;"R$"-#,##0.00'; 
        }
        XLSX.utils.book_append_sheet(wb, ws, "Receitas");
        XLSX.writeFile(wb, "receitas_filtradas.xlsx");
        botaoAtivador.innerHTML = textoOriginal;
        botaoAtivador.disabled = false;
    };
    carregarSheetJS(gerar, botaoAtivador, textoOriginal);
};

window.exportarDespesasXLSX = function(botaoAtivador) {
    const despesasFiltradas = obterDadosFiltrados('despesas');
    if (despesasFiltradas.length === 0) return alert('Não há dados de despesas para exportar com os filtros atuais.');
    const textoOriginal = botaoAtivador.innerHTML;
    botaoAtivador.innerHTML = "⏳ Gerando...";
    botaoAtivador.disabled = true;

    const gerar = () => {
        const dadosExcel = despesasFiltradas.map(row => ({
            'Função/SubFunção': row['Função/SubFunção'],
            'Vínculo': row['Vínculo'],
            'Fonte': row['Fonte'],
            'Valor Empenhado': limparEConverterNumero(row['Valor Empenhado']),
            'Valor Liquidado': limparEConverterNumero(row['Valor Liquidado']),
            'Valor Pago': limparEConverterNumero(row['Valor Pago'])
        }));
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            [3, 4, 5].forEach(C => {
                const cell = ws[XLSX.utils.encode_cell({c: C, r: R})]; 
                if (cell && cell.t === 'n') cell.z = '"R$"#,##0.00;"R$"-#,##0.00'; 
            });
        }
        XLSX.utils.book_append_sheet(wb, ws, "Despesas");
        XLSX.writeFile(wb, "despesas_filtradas.xlsx");
        botaoAtivador.innerHTML = textoOriginal;
        botaoAtivador.disabled = false;
    };
    carregarSheetJS(gerar, botaoAtivador, textoOriginal);
};

function carregarSheetJS(callback, botaoAtivador, textoOriginal) {
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = callback;
        script.onerror = () => { alert('Erro ao carregar biblioteca XLSX.'); botaoAtivador.innerHTML = textoOriginal; botaoAtivador.disabled = false; };
        document.head.appendChild(script);
    } else callback();
}

window.limparTodosFiltros = function() {
    filtrosAplicados = {};
    document.querySelectorAll('.btn-filtro-excel').forEach(btn => {
        btn.classList.remove('active-filter');
        const campoId = btn.id.replace('btn_drop_', '');
        const txtBox = document.getElementById(`txt_${campoId}`);
        if (txtBox) txtBox.innerText = "Todos";
        sincronizarCheckboxesComEstado(campoId);
    });
    limiteReceitas = 50; limiteDespesas = 50;
    renderizarTabela();
};

// ==========================================================================
/* SISTEMA DE ABAS E VISÕES */
// ==========================================================================
window.alternarAba = function(aba) {
    const moduloRec = document.getElementById('modulo-receitas');
    const moduloDesp = document.getElementById('modulo-despesas');
    const btnRec = document.getElementById('btn-tab-receitas');
    const btnDesp = document.getElementById('btn-tab-despesas');
    
    const estiloBase = "padding: 12px 28px; margin: 0 8px; cursor: pointer; border: 1px solid; border-radius: 8px; font-size: 15px; font-weight: 500; transition: all 0.25s ease-in-out; min-width: 180px;";
    const estiloAtivo = estiloBase + "background-color: #0284c7; color: white; border-color: #0284c7; font-weight: 600; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);";
    const estiloInativo = estiloBase + "background-color: #f8fafc; color: #64748b; border-color: #e2e8f0; box-shadow: none;";

    document.querySelectorAll('.tabela-container-antiga').forEach(el => el.style.display = 'none');

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
    const contBlocos = document.getElementById('container-blocos-receitas');
    const contTabela = document.getElementById('container-tabela-receitas-wrapper');
    const btnRel = document.getElementById('btn-visao-relatorio-rec');
    const btnTab = document.getElementById('btn-visao-tabela-rec');
    aplicarEstilosVisao(visao, contBlocos, contTabela, btnRel, btnTab);
};

window.alternarVisaoDespesas = function(visao) {
    const contBlocos = document.getElementById('container-blocos-despesas');
    const contTabela = document.getElementById('container-tabela-despesas-wrapper');
    const btnRel = document.getElementById('btn-visao-relatorio-desp');
    const btnTab = document.getElementById('btn-visao-tabela-desp');
    aplicarEstilosVisao(visao, contBlocos, contTabela, btnRel, btnTab);
};

function aplicarEstilosVisao(visao, blocos, tabela, btnRel, btnTab) {
    const estAtivo = "padding: 8px 18px; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";
    const estInativo = "padding: 8px 18px; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;";
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
/* LÓGICA DE FILTROS E PAGINAÇÃO */
// ==========================================================================
window.carregarMais = function(tipo) {
    if (tipo === 'receitas') limiteReceitas += 50; else limiteDespesas += 50;
    renderizarTabela();
};

function toggleSelectAll(campo, masterCheckbox) {
    document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => { if(cb.closest('label').style.display !== 'none') cb.checked = masterCheckbox.checked; });
}

function verificarSelectAll(campo) {
    let todos = true;
    document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => { if(!cb.checked) todos = false; });
    const master = document.querySelector(`.ms-select-all[data-campo="${campo}"]`);
    if(master) master.checked = todos;
}

function filtrarDropdownPesquisa(campo, input) {
    const termo = input.value.toLowerCase();
    document.querySelectorAll(`#drop_${campo} .ms-item-label`).forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(termo) ? '' : 'none';
    });
}

function atualizarTextoBotaoFiltro(campo) {
    const cbs = document.querySelectorAll(`.ms-item-${campo}`);
    const txt = document.getElementById(`txt_${campo}`);
    const btn = document.getElementById(`btn_drop_${campo}`);
    const vals = filtrosAplicados[campo];

    if (vals === undefined || vals.length === cbs.length) {
        if(txt) txt.innerText = "Todos";
        if(btn) btn.classList.remove('active-filter');
    } else if (vals.length === 1) {
        if(txt) txt.innerText = vals[0];
        if(btn) btn.classList.add('active-filter');
    } else {
        if(txt) txt.innerText = vals.length + " sel.";
        if(btn) btn.classList.add('active-filter');
    }
}

function aplicarFiltro(campo) {
    const vals = [];
    document.querySelectorAll(`.ms-item-${campo}`).forEach(cb => { if(cb.checked) vals.push(cb.value); });
    if (vals.length === document.querySelectorAll(`.ms-item-${campo}`).length || vals.length === 0) delete filtrosAplicados[campo]; 
    else filtrosAplicados[campo] = vals; 

    limiteReceitas = 50; limiteDespesas = 50;
    atualizarTextoBotaoFiltro(campo);
    const drop = document.getElementById(`drop_${campo}`);
    if (drop) drop.classList.add('hidden');
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
            let encontrou = false;
            for (let i = 0; i < vals.length; i++) {
                if (linha === vals[i].replace(/&quot;/g, '"').trim().toLowerCase()) { encontrou = true; break; }
            }
            if (!encontrou) return false;
        }
        return true;
    });
}

function fecharDropdownSemSalvar(campo) {
    const drop = document.getElementById(`drop_${campo}`);
    if (drop) drop.classList.add('hidden');
    const input = document.querySelector(`#drop_${campo} .excel-search-input`);
    if (input) input.value = "";
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
    if (!e.target.closest('th')) {
        document.querySelectorAll('.excel-dropdown').forEach(d => {
            if(!d.classList.contains('hidden')) fecharDropdownSemSalvar(d.id.replace('drop_', ''));
        });
    }
});

// ==========================================================================
/* ESTRUTURAÇÃO E POPULAÇÃO DAS TABELAS */
// ==========================================================================
function construirEstruturaTabelaBase(dados, containerId, tipo) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    if (!dados || dados.length === 0) {
        container.innerHTML = `<p class="no-data">Nenhum registro encontrado.</p>`;
        return;
    }

    const cabecalhos = Object.keys(dados[0]);
    let html = `<div class="responsive-table" style="width: 100%; overflow-x: auto; overflow-y: visible; border-radius: 8px; box-sizing: border-box; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #cbd5e1;">
                <table class="tabela-moderna" style="width: 100%; border-collapse: collapse; box-sizing: border-box;">
                <thead style="background-color: #1e293b; color: white;"><tr>`;

    cabecalhos.forEach((cabecalho, index) => {
        const campoId = Object.keys(mapaIdParaColuna).find(key => mapaIdParaColuna[key] === cabecalho);
        const valoresUnicos = [...new Set(dados.map(item => String(item[cabecalho]).trim()))].sort();
        const classeMenu = (index === cabecalhos.length - 1) ? 'excel-dropdown dropdown-last-child' : 'excel-dropdown';

        const isValor = cabecalho.includes('Valor');
        let widthStyle = '20%';
        if (tipo === 'receitas') {
            widthStyle = cabecalho === 'Descrição' ? '60%' : '20%';
        } else {
            if (cabecalho === 'Vínculo') widthStyle = '25%';
            else if (cabecalho === 'Fonte') widthStyle = '20%'; 
            else if (cabecalho === 'Função/SubFunção') widthStyle = '15%';
            else widthStyle = '13.3%';
        }
        const alinhamento = isValor ? 'justify-content: flex-end;' : 'justify-content: flex-start;';

        html += `
            <th data-col="${cabecalho}" style="position: relative; width: ${widthStyle}; padding: 12px 15px; border-bottom: 2px solid #94a3b8;">
                <div class="th-container" style="display: flex; align-items: center; gap: 10px; ${alinhamento}">
                    <span class="th-title-text" style="font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">${cabecalho}</span>
                    <button id="btn_drop_${campoId}" class="btn-filtro-excel" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; color: white; font-size: 11px; cursor: pointer; transition: background 0.2s;">
                         <span id="txt_${campoId}">Todos</span> 🔻
                    </button>
                </div>
                <div id="drop_${campoId}" class="${classeMenu} hidden" style="position: absolute; top: 100%; left: 0; z-index: 99999; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); width: 280px; padding: 12px; text-align: left; box-sizing: border-box; margin-top: 4px; color: #334155;">
                    <input type="text" class="excel-search-input" oninput="filtrarDropdownPesquisa('${campoId}', this)" placeholder="Pesquisar..." style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; box-sizing: border-box; margin-bottom: 8px; color: #334155;">
                    <label class="excel-option-label" style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; padding: 4px 0; cursor: pointer; width: 100%;">
                        <input type="checkbox" class="ms-select-all" data-campo="${campoId}" onchange="toggleSelectAll('${campoId}', this)"> <em>(Selecionar Tudo)</em>
                    </label>
                    <div class="excel-options-list" style="max-height: 180px; overflow-y: auto; margin-top: 6px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; background: #f8fafc; display: flex; flex-direction: column; gap: 4px;">
                        ${valoresUnicos.map(val => `
                            <label class="ms-item-label excel-option-label" style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; padding: 4px 6px; border-radius: 4px; cursor: pointer; width: 100%; box-sizing: border-box;">
                                <input type="checkbox" class="chk-item ms-item-${campoId}" value="${val.replace(/"/g, '&quot;')}" onchange="verificarSelectAll('${campoId}')" style="margin-top: 2px; flex-shrink: 0;"> 
                                <span style="word-break: break-word; line-height: 1.3;">${val || '(Vazio)'}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="excel-dropdown-actions" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                        <button class="btn-excel-ok" onclick="aplicarFiltro('${campoId}')" style="padding: 4px 12px; background: #0284c7; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600;">OK</button>
                        <button class="btn-excel-limpar" onclick="fecharDropdownSemSalvar('${campoId}')" style="padding: 4px 12px; background: #e2e8f0; color: #334155; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Cancelar</button>
                    </div>
                </div>
            </th>`;
    });

    html += `</tr></thead><tbody id="tbody_rows_${tipo}"></tbody></table></div>`;
    html += `<div id="container_btn_mais_${tipo}" style="text-align: center; margin-top: 20px; display: none;">
                <button onclick="carregarMais('${tipo}')" style="padding: 10px 24px; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: background-color 0.2s;">
                    Carregar mais 50 registros...
                </button>
             </div>`;
    container.innerHTML = html;
}

function gerarBlocoRelatorio(titulo, total, itens, corFundo = '#84cc16') {
    const itensHTML = itens && itens.length > 0 ? itens.map(item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 12px; font-family: monospace; font-size: 13px; width: 200px;">${item['Nat.Despesa'] || ''}</td>
            <td style="padding: 8px 12px; font-size: 13px;">${item['Descrição'] || ''}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 500; font-size: 13px; width: 180px; white-space: nowrap;">${formatarMoeda(limparEConverterNumero(item['Valor Receita']))}</td>
        </tr>`).join('') : `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic;">Nenhum lançamento encontrado para esta regra.</td></tr>`;
    return `
        <div style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="background-color: ${corFundo}; color: #0f172a; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-style: italic; font-size: 14px;">
                <span>${titulo}</span><span style="font-weight: 700;">${formatarMoeda(total)}</span>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;"><tbody>${itensHTML}</tbody></table>
            </div>
        </div>`;
}

function gerarBlocoRelatorioDespesas(titulo, objDados, corFundo = '#0284c7') {
    return `
        <div style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="background-color: ${corFundo}; color: #fff; padding: 12px 16px; font-weight: bold; font-size: 14px;">
                ${titulo}
            </div>
            <div style="background-color: #ffffff; padding: 12px 16px; display: flex; justify-content: flex-end; gap: 30px; font-size: 14px; border-top: 1px solid #e2e8f0;">
                <div style="color: #475569;">Empenhado: <strong style="color: #1e293b;">${formatarMoeda(objDados.empenhado)}</strong></div>
                <div style="color: #475569;">Liquidado: <strong style="color: #1e293b;">${formatarMoeda(objDados.liquidado)}</strong></div>
                <div style="color: #475569;">Pago: <strong style="color: #16a34a;">${formatarMoeda(objDados.pago)}</strong></div>
            </div>
        </div>`;
}

function renderizarTabela() {
    const dataAtual = new Date();
    const textoReferencia = `${dataAtual.toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}/${dataAtual.getFullYear()}`;
    const cabecalhoOficial = `
        <div style="font-family: Arial, Helvetica, sans-serif; text-align: center; background-color: #fff; margin-bottom: 25px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
            <div style="position: relative; height: 120px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 10px;">
                <div style="position: absolute; top: 35px; left: 0; right: 0; height: 1px; background-color: #999; z-index: 1;"></div>
                <div style="position: absolute; top: 60px; left: 0; right: 0; height: 3px; background-color: #000; z-index: 1;"></div>
                <img src="./brasao.png" alt="Brasão Oficial" style="height: 105px; position: relative; z-index: 2; background-color: #fff; padding: 0 25px;">
            </div>
            <div style="border-top: 1px solid #ccc; padding-top: 12px; margin-top: -10px;">
                <div style="font-size: 17px; font-weight: bold; color: #000; margin-bottom: 5px;">PREFEITURA MUNICIPAL DE BOTUCATU</div>
                <div style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 7px;">SECRETARIA MUNICIPAL DA FAZENDA</div>
                <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 10px;">Departamento de Planejamento, Orçamento e Gestão Econômica</div>
            </div>
            <div style="background-color: #a6a6a6; border-top: 1px solid #999; border-bottom: 1px solid #999; padding: 7px 0;">
                <span style="font-size: 15px; color: #000;">Referência - <strong>${textoReferencia}</strong></span>
            </div>
            <div style="margin-top: 15px;">
                <div style="background-color: #e2e2e2; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 7px 0;">
                    <span style="font-size: 16px; font-weight: bold; color: #000;">EDUCAÇÃO</span>
                </div>
                <div style="padding: 12px 0; background-color: #fcfcfc; border-bottom: 1px solid #ccc;">
                    <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 3px;">MANUTENÇÃO E DESENVOLVIMENTO DO ENSINO</div>
                    <div style="font-size: 14px; font-weight: bold; color: #000;">ART.212 - CONSTITUIÇÃO FEDERAL</div>
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
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background-color 0.2s;">
                <td class="mono-code" style="padding: 12px 15px; width: 20%;">${item['Nat.Despesa']}</td>
                <td style="padding: 12px 15px; width: 60%;">${item['Descrição']}</td>
                <td style="padding: 12px 15px; width: 20%; text-align: right; white-space: nowrap; font-weight: 500;">${formatarMoeda(limparEConverterNumero(item['Valor Receita']))}</td>
            </tr>
        `).join('');
        if (containerBtnMaisRec) containerBtnMaisRec.style.display = receitasFiltradas.length > limiteReceitas ? 'block' : 'none';
    }

    const dadosReceitaProc = processarDadosReceitas(receitasFiltradas);
    const containerBlocosRec = document.getElementById('container-blocos-receitas');
    if (containerBlocosRec) {
        containerBlocosRec.innerHTML = cabecalhoOficial + `
            <div style="background-color: #84cc16; color: #000; padding: 10px 15px; font-weight: bold; font-style: italic; border-radius: 5px; margin-bottom: 10px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">Impostos e Transferências</div>
            ${gerarBlocoRelatorio('MUNICIPAL (Col. R: 1112, 1113, 1114)', dadosReceitaProc.municipal.total, dadosReceitaProc.municipal.itens, '#84cc16')}
            ${gerarBlocoRelatorio('UNIÃO - FPM (Col. R: 1711)', dadosReceitaProc.uniaoFPM.total, dadosReceitaProc.uniaoFPM.itens, '#a3e635')}
            ${gerarBlocoRelatorio('ESTADO (Col. R: 1721.50, 1721.51, 1721.52)', dadosReceitaProc.estado.total, dadosReceitaProc.estado.itens, '#bef264')}
            ${gerarBlocoRelatorio('TOTAL DE IMPOSTOS E TRANSFERÊNCIAS (Soma Municipal + União + Estado)', dadosReceitaProc.totalImpostosTransferencias, [], '#38bdf8')}
            ${gerarBlocoRelatorio('APLICAÇÃO OBRIGATÓRIA (25%)', dadosReceitaProc.aplicacaoObrigatoria25, [], '#34d399')}
            ${gerarBlocoRelatorio('DEDUÇÕES PARA FORMAÇÃO - FUNDEB (Col. R: 9510)', dadosReceitaProc.deducoes.total, dadosReceitaProc.deducoes.itens, '#fbbf24')}
            ${gerarBlocoRelatorio('APLICAÇÃO MÍNIMA OBRIGATÓRIA - RECURSOS PRÓPRIOS (25% - Deduções FUNDEB)', dadosReceitaProc.aplicacaoMinimaRecursosProprios, [], '#c084fc')}
            ${gerarBlocoRelatorio('FUNDEB (Col. R: 1751.50... / 1321.01...)', dadosReceitaProc.fundeb.total, dadosReceitaProc.fundeb.itens, '#38bdf8')}
            ${gerarBlocoRelatorio('TRANSFERÊNCIA RECURSOS FUNDEB DESTINADOS CRIAÇÃO MATRÍCULAS E.T (Col. R: 1715.53.0.1.01.00)', dadosReceitaProc.fundebMatriculasET.total, dadosReceitaProc.fundebMatriculasET.itens, '#38bdf8')}
            <div style="background-color: #67e8f9; color: #000; padding: 10px 15px; font-weight: bold; font-style: italic; border-radius: 5px; margin-top: 20px; margin-bottom: 10px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">Receitas Adicionais para o Financiamento do Ensino</div>
            ${gerarBlocoRelatorio('RECEITA DA APLICAÇÃO FINANCEIRA (Col. R: 1321.01.1.1.02.01, .02, .04, .05, .08, .11)', dadosReceitaProc.aplicacaoFinanceira.total, dadosReceitaProc.aplicacaoFinanceira.itens, '#67e8f9')}
            ${gerarBlocoRelatorio('RECEITA DE TRANSFERÊNCIAS DO FNDE (Col. R: Começa com 1714)', dadosReceitaProc.fnde.total, dadosReceitaProc.fnde.itens, '#38bdf8')}
            ${gerarBlocoRelatorio('RECEITA DE TRANSFERÊNCIAS DO ESTADO (Col. R: 1724.51.0.1.02.00, .03.00)', dadosReceitaProc.estadoTransferencias.total, dadosReceitaProc.estadoTransferencias.itens, '#38bdf8')}
            ${gerarBlocoRelatorio('TOTAL - RECEITAS ADICIONAIS PARA O FINANCIAMENTO DO ENSINO', dadosReceitaProc.totalReceitasAdicionaisEnsino, [], '#0284c7')}
        `;
    }

    // ---------------- DESPESAS ----------------
    const despesasFiltradas = obterDadosFiltrados('despesas');
    const tbodyDesp = document.getElementById('tbody_rows_despesas');
    const containerBtnMaisDesp = document.getElementById('container_btn_mais_despesas');

    if (tbodyDesp) {
        tbodyDesp.innerHTML = despesasFiltradas.slice(0, limiteDespesas).map(item => `
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background-color 0.2s;">
                <td class="mono-code" style="padding: 12px 15px; width: 15%;">${item['Função/SubFunção']}</td>
                <td style="padding: 12px 15px; width: 25%;">${item['Vínculo']}</td>
                <td style="padding: 12px 15px; width: 20%; font-weight: 500; text-align: center;">${item['Fonte']}</td>
                <td style="padding: 12px 15px; width: 13.3%; text-align: right; white-space: nowrap; font-weight: 500;">${formatarMoeda(limparEConverterNumero(item['Valor Empenhado']))}</td>
                <td style="padding: 12px 15px; width: 13.3%; text-align: right; white-space: nowrap; font-weight: 500;">${formatarMoeda(limparEConverterNumero(item['Valor Liquidado']))}</td>
                <td style="padding: 12px 15px; width: 13.3%; text-align: right; white-space: nowrap; font-weight: 500;">${formatarMoeda(limparEConverterNumero(item['Valor Pago']))}</td>
            </tr>
        `).join('');
        if (containerBtnMaisDesp) containerBtnMaisDesp.style.display = despesasFiltradas.length > limiteDespesas ? 'block' : 'none';
    }

    const dadosDespProc = processarDadosDespesas(despesasFiltradas);
    
    // CÁLCULO DOS PERCENTUAIS DE APLICAÇÃO
    const totalEmpenhadoDesp = dadosDespProc.info12122.empenhado + dadosDespProc.info12361.empenhado + dadosDespProc.info12365.empenhado + dadosDespProc.info12367.empenhado;
    const totalLiquidadoDesp = dadosDespProc.info12122.liquidado + dadosDespProc.info12361.liquidado + dadosDespProc.info12365.liquidado + dadosDespProc.info12367.liquidado;
    const totalPagoDesp = dadosDespProc.info12122.pago + dadosDespProc.info12361.pago + dadosDespProc.info12365.pago + dadosDespProc.info12367.pago;
    
    const baseReceita = dadosReceitaProc.totalImpostosTransferencias;
    
    const percEmpenhado = baseReceita > 0 ? ((totalEmpenhadoDesp / baseReceita) * 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';
    const percLiquidado = baseReceita > 0 ? ((totalLiquidadoDesp / baseReceita) * 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';
    const percPago = baseReceita > 0 ? ((totalPagoDesp / baseReceita) * 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0,00';

    const containerBlocosDesp = document.getElementById('container-blocos-despesas');
    
    if (containerBlocosDesp) {
        containerBlocosDesp.innerHTML = cabecalhoOficial + `
            <!-- CABEÇALHO DE PERCENTUAL DE APLICAÇÃO -->
            <div style="background-color: #1e293b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; text-transform: uppercase; text-align: center; color: #f8fafc; letter-spacing: 0.5px;">
                    Despesas Consideradas na Aplicação Obrigatória
                </h3>
                <div style="display: flex; justify-content: space-between; gap: 15px; background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="flex: 1; text-align: center; border-right: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Empenhado</div>
                        <div style="font-size: 16px; font-weight: bold; color: #e2e8f0; margin-bottom: 2px;">${formatarMoeda(totalEmpenhadoDesp)}</div>
                        <div style="font-size: 20px; font-weight: 800; color: #38bdf8;">${percEmpenhado}%</div>
                    </div>
                    <div style="flex: 1; text-align: center; border-right: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Liquidado</div>
                        <div style="font-size: 16px; font-weight: bold; color: #e2e8f0; margin-bottom: 2px;">${formatarMoeda(totalLiquidadoDesp)}</div>
                        <div style="font-size: 20px; font-weight: 800; color: #34d399;">${percLiquidado}%</div>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Pago</div>
                        <div style="font-size: 16px; font-weight: bold; color: #e2e8f0; margin-bottom: 2px;">${formatarMoeda(totalPagoDesp)}</div>
                        <div style="font-size: 20px; font-weight: 800; color: #a3e635;">${percPago}%</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 11px; color: #64748b;">
                    * Percentuais calculados sobre o Total de Impostos e Transferências (${formatarMoeda(baseReceita)})
                </div>
            </div>

            ${gerarBlocoRelatorioDespesas('Regra 1 - Função/Sub 12.122 | Fonte 1 | Vínculos: 200.012, 210.000, 220.000, 240.000', dadosDespProc.info12122, '#0284c7')}
            ${gerarBlocoRelatorioDespesas('Regra 2 - Função/Sub 12.361 | Fonte 1 | Vínculos: 200.012, 210.000, 220.000, 240.000', dadosDespProc.info12361, '#0284c7')}
            ${gerarBlocoRelatorioDespesas('Regra 3 - Função/Sub 12.365 | Fonte 1 | Vínculos: 200.012, 210.000, 220.000, 240.000', dadosDespProc.info12365, '#0284c7')}
            ${gerarBlocoRelatorioDespesas('Regra 4 - Função/Sub 12.367 | Fonte 1 | Vínculos: 200.012, 210.000, 220.000, 240.000', dadosDespProc.info12367, '#0284c7')}
        `;
    }
}

// ==========================================================================
/* INJEÇÃO DA INTERFACE */
// ==========================================================================
document.getElementById('btn-processar').addEventListener('click', async () => {
    const inputReceitas = document.getElementById('csv-receitas').files[0];
    const inputDespesas = document.getElementById('csv-despesas').files[0];

    if (!inputReceitas || !inputDespesas) { alert('Por favor, selecione os dois arquivos antes de continuar.'); return; }

    try {
        const [textoReceitas, textoDespesas] = await Promise.all([lerArquivo(inputReceitas), lerArquivo(inputDespesas)]);
        const mapeamentoReceitas = { 'R': 'Nat.Despesa', 'K': 'Descrição', 'AB': 'Valor Receita' };
        const mapeamentoDespesas = { 'BJ': 'Função/SubFunção', 'BW': 'Vínculo', 'AT': 'Fonte', 'L': 'Valor Empenhado', 'N': 'Valor Liquidado', 'P': 'Valor Pago' };

        dadosGlobaisReceitas = converterCSVParaObjeto(textoReceitas, mapeamentoReceitas);
        dadosGlobaisDespesas = converterCSVParaObjeto(textoDespesas, mapeamentoDespesas);

        filtrosAplicados = {}; limiteReceitas = 50; limiteDespesas = 50;

        const dashboard = document.getElementById('dashboard');
        dashboard.classList.remove('hidden');
        dashboard.style.cssText = "width: 95%; max-width: 1300px; margin: 0 auto; padding: 0 15px; box-sizing: border-box;";

        document.getElementById('resultado-status').innerHTML = `
            <style>
                .tabela-moderna tbody tr:nth-child(even) { background-color: #f8fafc; }
                .tabela-moderna tbody tr:hover { background-color: #f1f5f9; }
                .tabela-moderna td { color: #334155; font-size: 13px; }
                .mono-code { font-family: 'Consolas', 'Courier New', monospace; color: #475569; font-weight: 600; }
                .btn-filtro-excel:hover { background: rgba(255,255,255,0.2) !important; }
            </style>
            
            <div class="abas-navegacao" style="margin: 10px 0 20px 0; text-align: center; display: flex; justify-content: center; width: 100%;">
                <button id="btn-tab-receitas" onclick="alternarAba('receitas')">Receitas</button>
                <button id="btn-tab-despesas" onclick="alternarAba('despesas')">Despesas</button>
            </div>

            <!-- MODULO DE RECEITAS -->
            <div id="modulo-receitas" style="width: 100%; box-sizing: border-box; margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; background: white; padding: 15px; border-radius: 8px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <h3 style="margin: 0; color: #1e293b; font-size: 1.3rem; margin-right: 15px;">Receitas</h3>
                        <button id="btn-visao-relatorio-rec" onclick="alternarVisaoReceitas('relatorio')" style="padding: 8px 18px; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">📊 Demonstrativo</button>
                        <button id="btn-visao-tabela-rec" onclick="alternarVisaoReceitas('tabela')" style="padding: 8px 18px; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">📋 Tabela</button>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="imprimirRelatorio()" style="padding: 8px 14px; background-color: #475569; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">🖨️ Imprimir Relatório</button>
                        <button onclick="exportarReceitasXLSX(this)" style="padding: 8px 14px; background-color: #0369a1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">📊 Exportar (XLSX)</button>
                        <button onclick="limparTodosFiltros()" style="padding: 8px 14px; background-color: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">🧹 Limpar Filtros</button>
                    </div>
                </div>
                <div id="container-blocos-receitas" style="display: block;"></div>
                <div id="container-tabela-receitas-wrapper" style="display: none; background: white; padding: 15px; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: #334155; font-size: 1.1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Manipulação de Dados da Tabela</h4>
                    <div id="nova-tabela-receitas"></div>
                </div>
            </div>

            <!-- MODULO DE DESPESAS -->
            <div id="modulo-despesas" style="width: 100%; box-sizing: border-box; margin-top: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: none;">
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; background: white; padding: 15px; border-radius: 8px; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <h3 style="margin: 0; color: #1e293b; font-size: 1.3rem; margin-right: 15px;">Despesas</h3>
                        <button id="btn-visao-relatorio-desp" onclick="alternarVisaoDespesas('relatorio')" style="padding: 8px 18px; background-color: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">📊 Demonstrativo</button>
                        <button id="btn-visao-tabela-desp" onclick="alternarVisaoDespesas('tabela')" style="padding: 8px 18px; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">📋 Tabela</button>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="imprimirRelatorio()" style="padding: 8px 14px; background-color: #475569; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">🖨️ Imprimir Relatório</button>
                        <button onclick="exportarDespesasXLSX(this)" style="padding: 8px 14px; background-color: #0369a1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">📊 Exportar (XLSX)</button>
                        <button onclick="limparTodosFiltros()" style="padding: 8px 14px; background-color: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">🧹 Limpar Filtros</button>
                    </div>
                </div>
                
                <div id="container-blocos-despesas" style="display: block;"></div>
                
                <div id="container-tabela-despesas-wrapper" style="display: none; background: white; padding: 15px; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: #334155; font-size: 1.1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Manipulação de Dados da Tabela</h4>
                    <div id="nova-tabela-despesas"></div>
                </div>
            </div>
        `;

        construirEstruturaTabelaBase(dadosGlobaisReceitas, 'nova-tabela-receitas', 'receitas');
        construirEstruturaTabelaBase(dadosGlobaisDespesas, 'nova-tabela-despesas', 'despesas');
        renderizarTabela();
        
        document.querySelectorAll('.tabela-container-antiga').forEach(el => { if(el.parentElement) el.parentElement.style.display = 'none'; });

        alternarAba('receitas');

    } catch (erro) {
        console.error(erro);
        alert(`Erro durante o processamento: ${erro.message}`);
    }
});