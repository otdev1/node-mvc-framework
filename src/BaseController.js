export default class BaseController {
    #localData
    #globalData
    #templatePath
    #renderData

    constructor() {
      this.#localData = {};
      this.#globalData = {};
      this.#templatePath = '';
      this.#renderData = {
        statusCode: 200,
        contentType: 'text/html',
        params: {}
      };
    }
  
    async run(action, data = {}) {
        if (!this[action]) 
        {
            this.#renderData.statusCode = 404;
        } 
        else 
        {
            try {
                for (let d in data) {
                this[d] = data[d];
                }

                await this[action]();
        
                this.#templatePath = `./views/${this.#controllerPath()}/${action}.ejs`;

            } 
            catch (err) {
                this.#renderData.statusCode = 500;

                this.#renderData.params = {
                    error: {
                        message: err.message,
                        stack: err.stack
                    }
                };
            }

        }

    }

    redirectTo(path) {
      this.#renderData = {
        statusCode: 301,
        contentType: '',
        params: {
          Location: path
        }
      };
    }
  
    set(keys, data) {
      if (typeof (keys) === "object") {
        for (let k in keys) {
          this.set(k, keys[k]);
        }
      } else {
        this.#localData[keys] = data;
      }
    }
  
    setG(keys, data) {
      if (typeof (keys) === "object") {
        for (let k in keys) {
          this.setG(k, keys[k]);
        }
      } else {
        this.#globalData[keys] = data;
      }
    }
  
    #controllerPath() {
      return this.constructor.name.replace('Controller', '').toLowerCase();
    }

    getRenderData()
    {
      return this.#renderData;
    }

    getTemplatePath()
    {
      return this.#templatePath;
    }

    getLocalData()
    {
      return this.#localData;
    }

    getGlobalData()
    {
      return this.#globalData;
    }

  };