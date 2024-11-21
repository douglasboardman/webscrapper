const axios = require("axios");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const https = require("https");
const fs = require("fs");

const BASE_URL = "https://www2.comprasnet.gov.br/siasgnet-atasrp/public/";
const ITEM_URL =
  "https://www2.comprasnet.gov.br/siasgnet-atasrp/public/visualizarItemSRP.do?method=iniciar&itemAtaSRP.codigoItemAtaSRP=";
const uasg = "158127";
const modCompra = "5";
const numCompra = "90004";
const anoCompra = "2024";
const participante = "IFFar - Campus Uruguaiana"

const camposFornecMaterial = [
  "classificação",
  "fornecedor",
  "marca",
  "qtdHomologada",
  "qtdAutorizada",
  "valUnitHomologado",
  "valUnitRenegociado",
  "ação",
];

const camposFornecServico = [
  "classificação",
  "fornecedor",
  "qtdHomologada",
  "qtdAutorizada",
  "valUnitHomologado",
  "valUnitRenegociado",
  "ação",
];

var numItens = 0;
var numPaginas = 0;
var pags = [];
var listaCodItens = [];
var itensUnidade = [];
var vigencia = {
  vigenciaPublicada: true,
  dataIniVigencia: "08/10/2024",
  dataFimVigencia: "08/10/2025"
};

const requestHeaders = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  Cookie:
    "JSESSIONID=5A48955AECEEDE50083AD4BF9E39E05B.siasgnet2; ss_lbappSIASGNETSIASGNETWSREST=1.siasgnet2; ss_lbappSIASGNETSP=1.siasgnet2; ss_lbappSIASGNETCENTRALCOMPRAS=1.siasgnet2; ss_lbappSIASGNETDC=1.siasgnet2; ss_lbappSIASGNETADMIN=1.siasgnet2; ss_lbappSIASGNETJBOSSWS=1.siasgnet2; ss_lbappSIASGNETWSCOMPRAS=1.siasgnet2; ss_lbappSIASGNETWSEXT=1.siasgnet2; ss_lbappSIASGNETRDCDC=1.siasgnet2; ss_lbappSIASGNETRDCSP=1.siasgnet2; ss_lbappSIASGNETRDCIRP=1.siasgnet2; ss_lbappSIASGNETRDCPRESENCIAL=1.siasgnet2; ss_lbappSIASGNETATASRP=1.siasgnet2; ss_lbappSIASGNETIRP=1.siasgnet2; ss_lbappSIASGNETPUBLICADOR=1.siasgnet2; ss_lbappSIASGNET=1.siasgnet2",
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

const path =
  "pesquisarItemSRP.do?method=iniciar&parametro.identificacaoCompra.numeroUasg=" +
  uasg +
  "&parametro.identificacaoCompra.modalidadeCompra=" +
  modCompra +
  "&parametro.identificacaoCompra.numeroCompra=" +
  numCompra +
  "&parametro.identificacaoCompra.anoCompra=" +
  anoCompra;

function escapeCSVValue(value) {
  // Se o valor contém aspas duplas, substitua por duas aspas duplas
  if (value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  // Se o valor contém vírgulas ou quebras de linha, coloque entre aspas duplas
  if (value.includes(",") || value.includes("\n")) {
    return `"${value}"`;
  }

  return value;
}

function convertArrayOfObjectsToCSV(data) {
  console.log(data);
  const csvHeader = Object.keys(data[0]).map(escapeCSVValue).join(",");
  const csvRows = data.map((item) =>
    Object.values(item).map(escapeCSVValue).join(",")
  );

  return [csvHeader, ...csvRows].join("\n");
}

function saveCSVToFile(data, filePath) {
  const csvContent = convertArrayOfObjectsToCSV(data);
  fs.writeFileSync(filePath, csvContent, "utf8");
}

const getPage = async (path) => {
  const url = `${BASE_URL}${path}`;

  const content = await axios.get(url, axiosOptions);
  return content;
};

getPage(path)
  .then(async (content) => {
    let $ = cheerio.load(content.data);
    numItens = $('[name="cabecalhoLicitacaoSRP.quantidadeItens"]').attr(
      "value"
    );
    numPaginas = Math.ceil(numItens / 20);  // Correção aqui
    console.log(
      "Pregão: " + numCompra + "/" + anoCompra + "\n" +
      "UASG Gestora: " + uasg + "\n" +
      "Participante: " + participante + "\n" +
      "Total de itens do pregão: " + numItens + "\n" +
      "\nTotal de páginas de exibição: " + numPaginas
    );
    pags = coletaPaginas();
    console.log('pags:',pags);
    listaCodItens = await criarListaCodItens();
    itensUnidade = await listarItensUnidade();
    if(vigencia.vigenciaPublicada) {
      saveCSVToFile(itensUnidade, `./cache/Itens Uruguaiana - Pregão ${numCompra}-${anoCompra}.csv`)
    } else {
      console.error("*** Não foi possível listar os itens da unidade. Vigência da ata ainda não publicada.");
    }

  })
  .catch(console.error);

function coletaPaginas() {
  let arrPags = [];
  let urlParts = [
    "pesquisarItemSRP.do?parametro.identificacaoCompra.anoCompra=",
    "&funcaoRetorno=&numeroPagina=",
    "&parametro.identificacaoCompra.numeroUasg=",
    "&parametro.uasg.nome=&parametro.uasg.numeroUasg=",
    "&parametro.identificacaoCompra.modalidadeCompra=",
    "&method=consultarPorFiltro&parametro.anoLicitacao=",
    "&parametro.numeroLicitacao=",
    "&casoDeUsoOrigem=&parametro.identificacaoCompra.numeroCompra=",
  ];

  arrPags[0] = `${BASE_URL}${path}`;

  if (numPaginas > 1) {
    for (let i = 1; i < numPaginas; i++) {
      nPag = i + 1;
      arrPags[
        i
      ] = `${BASE_URL}${urlParts[0]}${anoCompra}${urlParts[1]}${nPag}${urlParts[2]}${uasg}${urlParts[3]}${uasg}${urlParts[4]}${modCompra}${urlParts[5]}${anoCompra}${urlParts[6]}${numCompra}${urlParts[7]}${numCompra}`;
    }
  }

  return arrPags;
}

async function criarListaCodItens() {
  let lista = [];
  let arr = [];
  let content = "";

  for (let i = 0; i < pags.length; i++) {
    content = await axios.get(pags[i], axiosOptions);
    arr = content.data.split('<a href="javascript:selecionarItem(');
    arr.shift();

    for (let j = 0; j < arr.length; j++) {
      str = arr[j];
      n = String(str).indexOf(');"');
      lista.push(String(str).substring(0, n));
    }
  }
  return lista;
}

async function getData(url) {
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });
  const data = await page.content();
  await browser.close();
  return data;
}

async function carregaDadosEdital() {

}

async function listarItensUnidade() {
  let url, content;
  let lista = [];
  let campos = [];
  let objFornecimento = {};

  for (const cod of listaCodItens) {
    url = ITEM_URL + cod;
    content = await axios.get(url, axiosOptions);
    let $ = cheerio.load(content.data);
    let tipoMaterial = $('[name="cabecalhoItemSRP.tipoItem"]').attr("value");

    // Confere se o item possui fornecedor
    let tbFornecedor = $("table#fornecedorSRP.dados > tbody > tr");
    if (tbFornecedor.length > 0) {
      if (tipoMaterial == "Material") {
        campos = camposFornecMaterial;
      } else if (tipoMaterial == "Serviço") {
        campos = camposFornecServico;
      }

      if (campos) {
        tbFornecedor.find("td").each((index, cell) => {
          objFornecimento[campos[index]] = $(cell).text().trim();
        });
        if (tipoMaterial == "Serviço") objFornecimento.marca = "Não se aplica";
      }
      
      let vigAtaIni = $(
         '[name="itemAtaSRP.resultado.dataInicioVigenciaAta"]'
      ).attr("value");

      
      let vigAtafim = $(
        '[name="itemAtaSRP.resultado.dataFimVigenciaAta"]'
      ).attr("value");

      vigAtaIni = typeof(vigAtaIni) == "undefined" ? vigencia.dataIniVigencia : vigAtaIni;
      vigAtafim = typeof(vigAtafim) == "undefined" ? vigencia.dataFimVigencia : vigAtafim;

      if (vigAtaIni.length > 0 || vigencia.vigenciaPublicada) {
        if(!vigencia.vigenciaPublicada){
          vigencia.dataIniVigencia = vigAtaIni;
          vigencia.dataFimVigencia = vigAtafim;
          vigencia.vigenciaPublicada = true;
        }

        let numItem = $('[name="cabecalhoItemSRP.numeroItem"]').attr("value");
        let descBreve = $('[name="cabecalhoItemSRP.descricaoItem"]').attr(
          "value"
        );
        let descDetalhada = $(
          '[name="cabecalhoItemSRP.descricaoDetalhadaItem"]'
        ).text();
        let unFornec = $('[name="cabecalhoItemSRP.unidadeFornecimento"]').attr(
          "value"
        );

        // Confere se a unidade é participante do item no pregão
        if (content.data.includes("158503 -") || content.data.includes("158127 -")) {
          let data = await getData(url);
          if (data.includes("Uruguaiana/RS")) {
            let tmp = [];
            let qtdUnidade = "";
            tmp = data.split("<td>89516 - Uruguaiana/RS</td>");
            tmp = tmp[1].split('<td class="numero">');
            tmp = tmp[1].split("</td>");
            qtdUnidade = tmp[0];

            let objItem = {
              numCompra: numCompra,
              anoCompra: anoCompra,
              uasg: uasg,
              iniVigencia: vigencia.dataIniVigencia,
              fimVigencia: vigencia.dataFimVigencia,
              numItem: numItem,
              descBreve: descBreve,
              descDetalhada: descDetalhada,
              unFornecimento: unFornec,
              fornecedor: objFornecimento.fornecedor,
              marca: objFornecimento.marca,
              valor: objFornecimento.valUnitHomologado,
              qtdUnidade: qtdUnidade,
            };
            console.log(objItem);
            lista.push(objItem);
          }
        } else {
          console.log('Item: ', numItem);
        }
      }
    }
  }
  return lista;
}
