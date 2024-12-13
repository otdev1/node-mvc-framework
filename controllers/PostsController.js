import BaseController from '../src/BaseController.js';
import Post from '../models/Post.js';

export default class PostsController extends BaseController {
  async index() {

    const posts = await Post.s_all();

    this.set({ posts: posts });
  }

  async show() {
    const post = await Post.find(this.params.id);
    
    this.set({ post: post });
  }

  async create() {
    const post = await Post.s_create({ title: this.params.title, content: this.params.content });
  
    if (await post.save()) {
      this.flash.set('success', 'Post create successfully.');
    } else {
      this.flash.set('error', 'Something weird happened: ' + post.errors.join(' | '));
    }
    this.redirectTo('/posts');
  }

  async editView() {

    const post = await Post.find(this.params.id);
    
    this.set({ post: post });

  }

  async destroy() {

    const post = await Post.find(this.params.id);

    post.destroy();

    this.redirectTo('/posts');

  }

};