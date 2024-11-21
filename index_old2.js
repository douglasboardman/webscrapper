const axios = require("axios");
const https = require("https");

const BASE_URL_CONTRATOS =
  "https://contratos.sistema.gov.br/transparencia/compras";
const pathLevantamentoEditais =
  "/search?modalidade_id=76&modalidade_id_text=05 - Pregão&unidade_origem_id=9101&unidade_origem_id_text=158127 - INST.FED.DE EDUC.,CIENC.E TEC.FARROUPILHA";

  const requestHeaders = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
  };
  
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  
  const axiosOptions = {
    headers: requestHeaders,
    httpsAgent: agent,
  };

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

const pathItensEdital = (codEdital) => {
  return `/${codEdital}/itens/search`;
};

async function getDataByPost(path, payload) {
  const url = `${BASE_URL_CONTRATOS}${path}`;
  let result;
  try {
    result = await axios.post(url, payload, axiosOptions);
  } catch (error) {
    result = error;
  }
  return result;
}

async function atualizaRepositorioEdital() {
  console.log("Service/atualizaRepositorioEdital");
  const dadosPost = {
    modalidade_id: "76",
    modalidade_id_text: "05 - Pregão",
    unidade_origem_id: "9101",
    unidade_origem_id_text:
      "158127 - INST.FED.DE EDUC.,CIENC.E TEC.FARROUPILHA",
  };

  const content = await getDataByPost(pathLevantamentoEditais, dadosPost);
  const array = content.data.data;
  console.log(array);
  const listaEditais = await coletaDadosLevantamentoEditais(array);
  console.log(listaEditais);

  const dadosEditais = await listaEditais.reduce(
    async (accumulatorPromise, element) => {
      const accumulator = await accumulatorPromise;
      const lista_itens = await coletaCodigosItensEdital(element.cod_edital);
      const obj = {
        ...element,
        itens_homologados: JSON.stringify(lista_itens),
      };
      accumulator.push(obj);
      return accumulator;
    },
    Promise.resolve([])
  );

  // return await this.prismaService.repositorio_editais.createMany({
  //   data: dadosEditais
  // });
  console.log(dadosEditais);
  return dadosEditais;
}

async function coletaDadosLevantamentoEditais(response) {
  const listaEditais = [];
  for (const element of response) {
    const cod_edital = parseInt(
      element[10].match(/compras\/(\d+)\/show/)[1],
      10
    );
    if (!codsEditaisRepositorio.includes(cod_edital)) {
      const orgao = element[0]
        .match(/>([^<]*)</)[1]
        .trim()
        .substring(0, 6); // Replace `left` function
      const modalidade = element[4].match(/>([^<]*)</)[1].trim();
      const num_edital = element[5].match(/>([^<]*)</)[1].trim();
      const obj = {
        un_gestora: orgao,
        modalidade: modalidade,
        num_edital: num_edital,
        cod_edital: cod_edital,
      };
      console.log(obj);
      listaEditais.push(obj);
    }
  }
  return listaEditais;
}

async function coletaCodigosItensEdital(codEdital) {
  const path = pathItensEdital(codEdital);
  const response = await getDataByPost(path, {});
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

atualizaRepositorioEdital();