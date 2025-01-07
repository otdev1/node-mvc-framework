import { match } from 'path-to-regexp';

class StaticRouter {

  static routes = {
      "GET": {},
      "POST": {},
      "PUT": {},
      "PATCH": {},
      "DELETE": {}
    };

  static get(path, resolve) {
    if (!this.routes['GET'][path]) {
      
      this.routes['GET'][path] = resolve;
    }
  }

  static post(path, resolve) {
    if (!this.routes['POST'][path]) {

      this.routes['POST'][path] = resolve;
    }
  }

  static put(path, resolve) {
    if (!this.routes['PUT'][path]) {

      this.routes['PUT'][path] = resolve;
    }
  }

  static delete(path, resolve) {
    if (!this.routes['DELETE'][path]) {

      this.routes['DELETE'][path] = resolve;
    }
  }

  static resolve(method, path) {

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

export default StaticRouter;
