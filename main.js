import Framework from './src/Framework.js';
import Router from './src/Router.js';

const router = new Router();

router.get('/', 'HomeController#index');
router.get('/posts', 'PostsController#index');
router.get('/post/:id', 'PostsController#show');
router.post('/posts', 'PostsController#create');
router.get('/post/edit/:id', 'PostsController#editView');

router.put('/posts/:id', 'PostsController#edit');
router.delete('/post/destroy/:id', 'PostsController#destroy');

const myFramework = new Framework(router);

myFramework.static(['stylesheets', 'images', 'javascripts']);

myFramework.run(4001, 'localhost');