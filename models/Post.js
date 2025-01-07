import * as Model from '../src/ModelBase.js';

export default class Post extends Model.Base{

  setup() {
    this.setAttribute("title", Model.Attributes.String);
    this.setAttribute("content", Model.Attributes.String);

    this.validate("title", Model.Validators.PresenceOf);
    
    this.beforeSave("prependTitle");
    this.afterSave("appendContent");
  }

  prependTitle() {
    if (this.title) 
    {
      this.title = this.title;
    }
  }

  appendContent() {
    this.content = this.content;
  }
  
}
