const axios = require("axios");
const https = require("https");
const fs = require("fs");

const BASE_URL = "https://icase.sbcp.itarget.com.br";

const path = (uf, pag) => {
  return `/api/localiza-profissional/?format=json&nome=&categoria_profissional_id=&uf_descricao=${uf}&pag=${pag}`;
}


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

function escapeCSVValue(value) {
  // Se o valor contém aspas duplas, substitua por duas aspas duplas
  if(value != null && value != undefined && typeof value == 'string') {
    console.log('value: ', value);
    if (value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
  
    // Se o valor contém vírgulas ou quebras de linha, coloque entre aspas duplas
    if (value.includes(",") || value.includes("\n")) {
      return `"${value}"`;
    }
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
}

listaCirurgioes = async (uf) => {
  let pag = 1;
  let nRegistros = 1;
  let listaEstado = [];

  while (nRegistros > 0) {
    const dados = await getPage(path(uf, pag));
    nRegistros = dados.data.data.length;
    if(nRegistros > 0){
      listaEstado = [...listaEstado, ...dados.data.data];
    }

    console.log(`Página ${pag} carregada.`, dados.data.data);

    if (nRegistros == 20) {
      pag += 1;
    } else {
      break;
    } 
  }

  const filePath = `./cache/Cirurgioes - ${uf}.csv`;
  saveCSVToFile(listaEstado, filePath);
  
  console.log(listaEstado);
}

listaCirurgioes('PA');