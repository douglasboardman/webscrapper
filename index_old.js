const axios = require("axios");

BASE_URL_CONTRATOS = "https://contratos.sistema.gov.br/transparencia/compras";
const pathLevantamentoEditais =
  "/search?modalidade_id=76&modalidade_id_text=05 - Pregão&unidade_origem_id=9101&unidade_origem_id_text=158127 - INST.FED.DE EDUC.,CIENC.E TEC.FARROUPILHA";

const pathItensEdital = (codEdital) => `/${codEdital}/itens/search`;

const requestHeaders = {
  Host: "contratos.sistema.gov.br",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-CSRF-TOKEN": "",
  "X-Requested-With": "XMLHttpRequest",
  "Content-Length": "2352",
  Origin: "https://contratos.sistema.gov.br",
  Connection: "keep-alive",
  Referer:
    "https://contratos.sistema.gov.br/transparencia/compras?unidade_origem_id=9101&unidade_origem_id_text=158127+-+INST.FED.DE+EDUC.%2CCIENC.E+TEC.FARROUPILHA&modalidade_id=76&modalidade_id_text=05+-+Preg%C3%A3o",

  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

const dadosPost = {
  modalidade_id: "76",
  modalidade_id_text: "05 - Pregão",
  unidade_origem_id: "9101",
  unidade_origem_id_text: "158127 - INST.FED.DE EDUC.,CIENC.E TEC.FARROUPILHA",
};

async function getDataByPost(path, payload) {
  const url = `${BASE_URL_CONTRATOS}${path}`;
  return axios.post(url, payload, requestHeaders);
}

getDataByPost(pathLevantamentoEditais, dadosPost).then(async (content) => {
  //let dadosEditais = [];
  const array = content.data.data;
  const listaEditais = await coletaDadosLevantamentoEditais(array);
  console.log(listaEditais);

  //   const dadosEditais = await listaEditais.reduce(async (accumulatorPromise, element) => {
  //     const accumulator = await accumulatorPromise;
  //     const lista_itens = await coletaCodigosItensEdital(element.cod_edital);
  //     const obj = {
  //       ...element,
  //       lista_itens: lista_itens,
  //     };
  //     accumulator.push(obj);
  //     return accumulator;
  //   }, Promise.resolve([]));

  //   console.log(dadosEditais);
});

async function coletaDadosLevantamentoEditais(response) {
  let listaEditais = [];
  await response.forEach(async (element) => {
    const cod_edital = parseInt(
      element[10].match(/compras\/(\d+)\/show/)[1],
      10
    );
    if (!codsEditaisRepositorio.includes(cod_edital)) {
      const orgao = element[0].match(/>([^<]*)</)[1].trim();
      const modalidade = element[4].match(/>([^<]*)</)[1].trim();
      const num_edital = element[5].match(/>([^<]*)</)[1].trim();
      const obj = {
        orgao: orgao,
        modalidade: modalidade,
        num_edital: num_edital,
        cod_edital: cod_edital,
      };
      listaEditais.push(obj);
    }
  });
  return listaEditais;
}

async function coletaCodigosItensEdital(codEdital) {
  const response = await getDataByPost(pathItensEdital(codEdital), {});
  const content = response.data.data;
  return content.map((item) => {
    const num_item = item[0].match(/>([^<]*)</)[1].trim();
    const cod_item = item[4].match(/itens\/(\d+)\/show/)[1];
    return {
      num_item: num_item,
      cod_item: cod_item,
    };
  });
}

const codsEditaisRepositorio = [
  510334, 508959, 507541, 505858, 504786, 503434, 500255, 499776, 499188,
  499175, 499145, 496935, 495652, 495495, 489125, 488209, 487802, 487009,
  485646, 484207, 483825, 483697, 482660, 481823, 481515, 474290, 472388,
  465976, 462214, 460933, 459111, 458212, 456845, 449673, 443401, 443279,
  442948, 440985, 433426, 424145, 423876, 420392, 414436, 413355, 411929,
  407310, 407286, 404822, 401765, 401015, 400670, 400228, 399462, 398962,
  397990, 396652, 395276, 394161, 390517, 390112, 390106, 389174, 389174,
  388058, 387501, 386957, 386023, 382261, 378207, 375721, 375468, 368467,
  367970, 362950, 362909, 361685, 358289, 354432, 352144, 350434, 350060,
  349525, 349473, 349083, 348699, 348432, 347204, 344167, 337393, 336204,
  334681, 333717, 328985, 323535, 317949, 309463, 309249, 306047, 304579,
  304117, 301881, 299725, 299270, 295687, 287829, 286453, 286351, 286288,
  285232, 283721, 278514, 275177, 274886, 274372, 265425, 260484, 258595,
  258218, 257445, 256928, 251893, 251231, 251061, 249992, 247774, 246975,
  245247, 243948, 242045, 236897, 235407, 233431, 232156, 231976, 231774,
  231530, 231198, 230799, 230724, 227690, 217252, 216418, 214152, 213840,
  210105, 209490, 208951, 208017, 205961, 192476, 188988, 187377, 185394,
  169549, 160838, 158164, 157798, 157544, 151125, 149615, 113039, 103956, 97238,
  91364, 86630, 76582, 76402, 73127, 49526, 46809, 46734, 41914, 41838, 40898,
  36435, 32259, 21048, 20201, 19307, 15284, 14600, 11759, 11411, 8443, 6519,
  4277, 4034, 3767, 3031, 1435, 706,
];
