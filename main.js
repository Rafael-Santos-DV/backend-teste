import puppeteer from 'puppeteer';
import Express from 'express'
import cors from 'cors'
import crypto from 'crypto';
import "dotenv/config"

// const urls = ['https://www.kwai.com/@lorenaeestevao040/video/5250221373246074281', 'https://www.kwai.com/@Dacostagab/video/5252754598425194082', 'https://www.kwai.com/@biel.pv/video/5227421897948479111'];


const App = Express();

App.use(cors())

App.use(Express.json()) // for parsing application/json
// App.use(Express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

App.post("/urls-kwai", async (request, response) => {
  const urls = request.body;
  console.log("TESTE", urls)
  const links = await GetUrlsKwai(urls);
  // response.setHeader('Access-Control-Allow-Origin', '*');
  // response.setHeader('Access-Control-Request-Method', '*');

  return response.json(links)
})

App.listen(3000, () => console.log("Running in port 3000"))

async function GetUrlsKwai(urls) {

  // Inicializa o Puppeteer e abre um novo navegador e página
  const browser = await puppeteer.launch({ 
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process', '--no-zygote'] 
  });
  

  // Navega até a página do vídeo com um timeout reduzido

  const map = urls.map(async (url) => {
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 })

    return [page, response];
  })

  const promiseAll = await Promise.all(map);

  const videoSelector = '._kwai-player-video_uxc1a_11 video';

  const links = [];

  for await (const [page, response] of promiseAll) {
    await page.waitForSelector(videoSelector, { timeout: 300000 });
    const videoSrc = await page.evaluate((selector) => {
      const videoElement = document.querySelector(selector);
      return videoElement ? videoElement.src : null;
    }, videoSelector);
  
    if (videoSrc) {
      console.log('Link do vídeo:', videoSrc);
      links.push({
        name: crypto.randomUUID().split('-')[0],
        videoSrc
      });

    } else {
      console.error('Não foi possível encontrar o elemento de vídeo ou o atributo src.');
    }
  
    // Fecha o navegador
   
  }

  // Espera o elemento de vídeo carregar
  
  

  // Extrai o link do vídeo
  // const videoSrc = await page.evaluate((selector) => {
  //   const videoElement = document.querySelector(selector);
  //   return videoElement ? videoElement.src : null;
  // }, videoSelector);

  // if (videoSrc) {
  //   console.log('Link do vídeo:', videoSrc);
  // } else {
  //   console.error('Não foi possível encontrar o elemento de vídeo ou o atributo src.');
  // }

  // // Fecha o navegador
  await browser.close();

  return links;
}
