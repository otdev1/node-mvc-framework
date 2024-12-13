import BaseController from '../src/BaseController.js';

export default class HomeController extends BaseController {

  async index() {
    console.log('HomeController#index called from the controller');
  }
  
};