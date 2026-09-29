/**
 * CONFIGURAÇÃO DE COLUNAS DOS CSVs
 * ----------------------------------------------------------------------------
 * colunasCsv: letra da coluna no CSV (padrão Excel) → nome interno do campo.
 *   Se o sistema de origem mudar a posição de alguma coluna, basta
 *   ajustar a letra aqui. 'AN' (receita) e 'D'/'E'/'S' (despesa) são usados
 *   exclusivamente pelo módulo Saúde.
 *
 * mapaColunas: id do filtro (usado nos dropdowns da Base de Dados) → nome
 *   interno do campo. O prefixo 'rec_' / 'des_' indica a base de origem.
 */
SIOPEApp.config.colunasCsv = {
    receitas: {
        'R':  'Nat.Despesa',
        'K':  'Descrição',
        'AB': 'Valor Receita',
        'AN': 'Vínculo (Receita)'
    },
    despesas: {
        'D':  'Função',
        'E':  'Subfunção',
        'S':  'Órgão',
        'BJ': 'Função/SubFunção',
        'BW': 'Vínculo',
        'AT': 'Fonte',
        'L':  'Valor Empenhado',
        'N':  'Valor Liquidado',
        'P':  'Valor Pago'
    }
};

SIOPEApp.config.mapaColunas = {
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
};
