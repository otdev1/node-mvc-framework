import http from 'http';
import ejs from 'ejs';
import fs from 'fs';
import nodeStatic from 'node-static';
import BodyParser from './middlewares/BodyParser.js';
import FlashParser from './middlewares/FlashParser.js';

export default class Framework {
  #http
  #engine
  #router
  #static
  #controllers
  #middlewares
  #staticRoutes
  
  constructor(router) {

    // engine capabilities
    this.#http = http;
    this.#engine = ejs;
    this.#router = router;
    this.#static = new nodeStatic.Server('./public');

    // framework data
    this.#controllers = {};
    this.#middlewares = [BodyParser, FlashParser]; 
    this.#staticRoutes = [];

    // helpers
    this.logger = {
      info: (msg) => console.log(`INFO - ${msg}`),
      error: (msg) => console.error(`ERROR - ${msg}`),
      debug: (msg) => console.log(`DEBUG - ${msg}`),
      log: (msg) => console.log(msg)
    };
  }

  /*staticRoutes will/should be an array, static() is invoked in main.js*/
  static(staticRoutes) {
    this.#staticRoutes = staticRoutes;
  }

  async run(port = 4001, hostname = 'localhost') {
    this.#controllers = await this.#autoLoad('controllers/');

    const server = this.#http.createServer(async (request, response) => {

      this.logger.info(`${request.method} - ${request.url}`);

      request.setEncoding('utf-8');

      request.controller = { data: {}, templateData: {}, endwares: [] };

      if (this.#staticRoutes.includes(request.url.split('/')[1])) 
      {
        request.addListener('end', () => {
          this.#static.serve(request, response);
        }).resume();
      } 
      else 
      {
        /* process middlewares */
        const stack = this.#middlewares;

        let index = 0, layer;

        const handleMiddlewares = () => {

          const next = () => {
            layer = stack[index++];

            if (!layer) {
              this.#resolveResponse(request, response);
              return;
            }

            layer(request, response, next);
          }
          // start
          next();
        }

        handleMiddlewares();
   
      }

    });

    server.listen(port, hostname, () => {
      this.logger.info(`Server running at http://${hostname}:${port}/`);
    })

  }

  async #resolveResponse(request, response) {
    const requestTime = new Date().getTime();

    const resolvedData = this.#router.resolve(request.method, request.url);
  
    if (resolvedData === null) {
      response.statusCode = 404;
      response.setHeader('Content-Type', 'text/html');
      response.end('Page not found.');
    } else {
      this.logger.info(`Request processing ${resolvedData.controller}#${resolvedData.action}`);
  
      const controller = new this.#controllers[resolvedData.controller]();

      request.controller.data.params = { ...request.controller.data.params, ...resolvedData.params };

      await controller.run(resolvedData.action, request.controller.data);

      for (let i = 0; i < request.controller.endwares.length; i++) {
        let endware = request.controller.endwares[i];
        endware(request, response);
      }
  
      const renderData = controller.getRenderData();
      
      switch (renderData.statusCode) {
        case 301:
          response.writeHead(301, renderData.params);
          response.end();
          break;
        case 404:
          response.statusCode = 404;
          response.setHeader('Content-Type', renderData.contentType);
          response.end(this.#renderTemplate('./public/not-found.ejs'));
          break;
        case 500:
          response.statusCode = 500;
          response.setHeader('Content-Type', renderData.contentType);
          response.end(this.#renderTemplate('./public/500.ejs', { error: renderData.params.error }));
          break;
        default:
          response.statusCode = renderData.statusCode;

          response.setHeader('Content-Type', renderData.contentType);

          const templatePath = controller.getTemplatePath();

          const localData = controller.getLocalData();

          const globalData = controller.getGlobalData();

          let template = this.#renderTemplate(templatePath, { ...localData, ...globalData });
          
          let layout = this.#renderTemplate(`./views/layouts/application.ejs`, { ...globalData, ...request.controller.templateData, template: template });
          
          response.end(layout);
          
          break;
      }
    }
  
    let elapsedTime = (new Date().getTime() - requestTime) / 1000.0;
    this.logger.info(`Request finished in ${elapsedTime} seconds`);
  }
 
  #renderTemplate(path, data) {

    let startTime = new Date().getTime();

    let renderedHTML = "<template not found>";

    this.#engine.renderFile(path, data, {}, (err, str) => {
      if (err) {
        this.logger.log(err);
        return;
      }
      renderedHTML = str;

      let elapsedTime = (new Date().getTime() - startTime) / 1000.0;

      this.logger.info(`Templated loaded ${path} in ${elapsedTime} seconds`);
    });
  
    return renderedHTML;
  }

  async #autoLoad(folder) {
    let files = {};
    
    fs.readdirSync(`./${folder}`).forEach(async (file) => {

      let { default: _import } = await import(`../${folder}${file}`);

      files[file.replace('.js', '')] = _import;

    });
  
    return files;
  }

}