import { match } from 'path-to-regexp';

class Router {

  constructor() {
    this.routes = {
      "GET": {},
      "POST": {},
      "PUT": {},
      "PATCH": {},
      "DELETE": {}
    };
  }

  get(path, resolve) {
    if (!this.routes['GET'][path]) {

      this.routes['GET'][path] = resolve;
    }
  }
  
  post(path, resolve) {
    if (!this.routes['POST'][path]) {

      this.routes['POST'][path] = resolve;
    }
  }

  put(path, resolve) {
    if (!this.routes['PUT'][path]) {

      this.routes['PUT'][path] = resolve;
    }
  }

  delete(path, resolve) {
    if (!this.routes['DELETE'][path]) {

      this.routes['DELETE'][path] = resolve;
    }
  }

  resolve(method, path) {

    const routes = this.routes[method];

    for (let routePath in routes) {
    
      let route = routes[routePath]; 

      const matcher = match(routePath, { decode: decodeURIComponent });

      let result = matcher(path);

      if (result) {

        route = route.split('#');

        return {
          controller: route[0], 
          action: route[1],
          params: result.params
        };
      }
    }
  
    return null;
  }

};

export default Router;
