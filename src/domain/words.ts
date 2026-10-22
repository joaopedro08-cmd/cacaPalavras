export const normalizeWord = (value: string): string =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleUpperCase('pt-BR').trim();

export const WORDGUESS_ANSWERS = [
  'AMIGO', 'AREIA', 'ATLAS', 'BANHO', 'BARCO', 'BEIJO', 'BICHO', 'BOLSA', 'BRISA', 'CAMPO',
  'CANTO', 'CARRO', 'CHUVA', 'CINTO', 'CLIMA', 'COBRA', 'CONTO', 'CORAL', 'DANCA', 'DEDOS',
  'DOCE', 'FESTA', 'FLORE', 'FOLHA', 'FRUTA', 'GENTE', 'GRATO', 'HOBBY', 'IDEIA', 'JANTA',
  'LIVRO', 'LUGAR', 'MANGA', 'MUNDO', 'NORTE', 'NUVEM', 'OLHAR', 'ONTEM', 'OUVIR', 'PAZES',
  'PEDRA', 'PEIXE', 'PILHA', 'PINTA', 'PRAIA', 'PRATO', 'QUASE', 'RADIO', 'SABER', 'SAUDE',
  'SONHO', 'TEMPO', 'TERRA', 'TRAMA', 'VENTO', 'VERDE', 'VIVER'
].filter((word) => word.length === 5);

export const VALID_GUESSES = new Set([
  ...WORDGUESS_ANSWERS,
  'ABRIR', 'ACASO', 'ACIMA', 'ACRES', 'AGORA', 'AGUAS', 'ALADO', 'ALBUM', 'ALMAS', 'ALTAS',
  'AMADO', 'AMPLA', 'ANJOS', 'ANTES', 'APOIO', 'AROMA', 'ARTES', 'AVISO', 'AZUIS', 'BAIXO',
  'BALAS', 'BANDA', 'BANCO', 'BATER', 'BEBER', 'BELOS', 'BOLAS', 'BONUS', 'BRACO', 'BRAVO',
  'CABOS', 'CAIXA', 'CALMA', 'CALOR', 'CAMIL', 'CAPAS', 'CASAL', 'CASAS', 'CESTA', 'CHAVE',
  'CICLO', 'CLARO', 'COISA', 'COLAR', 'COMER', 'CORPO', 'CRIME', 'DARDO', 'DEIXA', 'DENTES',
  'DIZEM', 'DONOS', 'DORME', 'ELITE', 'ERROS', 'ESSAS', 'ESTAR', 'ESTRE', 'ETAPA', 'EXATO',
  'FALAR', 'FALTA', 'FAMOS', 'FAROL', 'FAZER', 'FELIZ', 'FERRO', 'FINAL', 'FLORA', 'FORTE',
  'FOTOS', 'FRASE', 'GOSTO', 'GRAMA', 'GRUPO', 'HOMEM', 'HORAS', 'IMPAR', 'JOGAR', 'JOVEM',
  'LADOS', 'LARGO', 'LEITE', 'LETRA', 'LIMAO', 'LINHA', 'LIVRE', 'LOUCO', 'LUTAR', 'MACIO',
  'MAIOR', 'MARCA', 'MEDOS', 'MENOS', 'MESAS', 'METRO', 'MIolo'.toLocaleUpperCase('pt-BR'), 'MINHA', 'MISTO',
  'MODOS', 'MORAR', 'MORTE', 'MUITO', 'NADAR', 'NAVIO', 'NEGRO', 'NIVEL', 'NOITE', 'NOMEA',
  'NOVAS', 'OBRAS', 'OESTE', 'ORDEN', 'OTIMO', 'PAGAR', 'PAPEL', 'PARAR', 'PARTE', 'PASSO',
  'PEDIR', 'PEGAR', 'PERTO', 'PESCA', 'PODER', 'POEMA', 'PONTO', 'PORTA', 'POUCO', 'PRECO',
  'PRIMO', 'PROSA', 'QUEDA', 'QUERO', 'RAIVA', 'RAZao'.toLocaleUpperCase('pt-BR'), 'REINO', 'RELOG',
  'RITMO', 'ROCHA', 'SABOR', 'SALTO', 'SANTO', 'SAUDE', 'SEIVA', 'SENHA', 'SERIE', 'SINAL',
  'SOMAR', 'SORTE', 'SUAVE', 'TARDE', 'TELHA', 'TEMA', 'TEXTO', 'TODAS', 'TODOS', 'TORRE',
  'TRATO', 'TREVO', 'UNICA', 'UNICO', 'USADO', 'VAGAS', 'VALOR', 'VAPOR', 'VIRAR', 'VISTO',
  'VOTOS', 'ZEBRA'
].map(normalizeWord).filter((word) => /^[A-Z]{5}$/.test(word)));

export const FORCA_ANSWERS = [
  'ANEL', 'BOLA', 'CAFE', 'DADO', 'FADA', 'GATO', 'LAGO', 'MESA', 'ONDA', 'PATO',
  'ABACATE', 'ABRIGO', 'AMARELO', 'AMIGOS', 'ANIMAL', 'ARCO', 'BICICLETA', 'BORBOLETA', 'CAMISA',
  'CANETA', 'CEREJA', 'CHUVEIRO', 'CIDADE', 'COELHO', 'CUPIDO', 'ESCOLA', 'ESTRELA', 'FAMILIA',
  'FLORESTA', 'GIRASSOL', 'JANELA', 'LARANJA', 'MACACO', 'MONTANHA', 'MORANGO', 'PASSARO', 'PLANETA',
  'SAPATO', 'SORRISO', 'TESOURO', 'VIAGEM', 'ABELHA', 'ALGODAO', 'AMIZADE', 'ARVORE', 'BALEIA',
  'BANANA', 'BONECA', 'CACHORRO', 'CADEIRA', 'CADERNO', 'CAMINHO', 'CASTELO', 'CAVALO', 'CORUJA',
  'DESENHO', 'DINHEIRO', 'DUVIDA', 'ESTOJO', 'FOGUETE', 'FORMIGA', 'FOGAO', 'FRANGO', 'GELEIA',
  'INVERNO', 'JARDIM', 'LAGARTA', 'LAMPADA', 'LEAO', 'LIVROS', 'MELANCIA', 'MENINA', 'MENINO',
  'NATUREZA', 'PIPOCA', 'QUEIJO', 'SABONETE', 'URSINHO', 'VASSOURA', 'VIZINHO', 'ZANGAO'
].map(normalizeWord).filter((word) => word.length >= 4 && word.length <= 8);

export const chooseWord = (words: readonly string[], recent: readonly string[]): string => {
  const options = words.filter((word) => !recent.includes(word));
  const pool = options.length > 0 ? options : words;
  return pool[Math.floor(Math.random() * pool.length)] ?? words[0] ?? 'AMIGO';
};
