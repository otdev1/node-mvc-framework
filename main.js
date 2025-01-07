import Framework from './src/Framework.js';

import StaticRouter from './src/StaticRouter.js';

StaticRouter.get('/', 'HomeController#index');

StaticRouter.get('/posts', 'PostsController#index');

StaticRouter.get('/post/:id', 'PostsController#show');

StaticRouter.post('/posts', 'PostsController#create');

StaticRouter.get('/post/edit/:id', 'PostsController#editView');

StaticRouter.post('/posts/:id', 'PostsController#edit');

StaticRouter.delete('/post/destroy/:id', 'PostsController#destroy');

const myFramework = new Framework(StaticRouter);

myFramework.static(['stylesheets', 'images', 'javascripts']);

myFramework.run(4001, 'localhost');
