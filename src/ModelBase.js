import { title } from 'node:process';
import { Attributes, Validators, Client } from './ModelHelpers.js';

import { EOL } from "node:os"; //node platform-sepecific newline constant https://stackoverflow.com/a/14063413


class Base {
  #tableName;
  #persisted;
  #beforeSaveHooks;
  #afterSaveHooks;
  #validationHooks;
  #attributes;
  #changedAttributes;
  #ref;
  #where;
  #limit;
  #offset;
  #orderBy;

  constructor(attrs = {}) {
    
    this.#tableName = this.constructor.name.toLowerCase() + "s";
    
    this.#persisted = false;
    
    this.#beforeSaveHooks = [];
    
    this.#afterSaveHooks = [];
    
    this.#validationHooks = [];
    
    this.#attributes = {};
    
    this.#changedAttributes = [];
    
    this.#ref = null;
    
    this.#where = [];
    
    this.#limit = null;
    
    this.#offset = null;
    
    this.#orderBy = null;
    
    this.errors = [];

    this.#attributes.id = { type: Attributes.Primary, value: null };
  
    this.#attributes['createdAt'] = { type: Attributes.DateTime, value: null };
    
    this.#attributes['updatedAt'] = { type: Attributes.DateTime, value: null };
    
    this.id = null;
    
    this.createdAt = null;

    this.updatedAt = null;

    this.setup();

    if (Object.keys(attrs).length > 0 && attrs.constructor === Object) {
      this.#setMassAttributes(attrs);
    }
  }

  static async find(id) {
    const obj = new this;
    return await obj.#find(id);
  }
  
  static async findBy(properties) {
    const obj = new this;
    return await obj.where(properties).first();
  }
  
  static async first() {
    const obj = new this;
    return await obj.first();
  }
  
  static async last() {
    const obj = new this;
    return await obj.last();
  }
  
  static async s_all() {
    try {
      let results = [];

      const res = await Client.query(`SELECT * FROM ${new this().#tableName} LIMIT 100;`);
      
      res.rows.forEach((row) => {
        let obj = new this();
        obj.#setMassAttributes(row);
        obj.#persisted = true;
        results.push(obj);
      });
  
      return results;
    } catch (err) {
      throw new Error(err);
    }
  }

  static async s_create(params) {
    const obj = new this(params);
    await obj.save();
    return obj;
  }

  static limit(amount) 
  { 
    return new this().ref(this).limit(amount); 
  }
  
  static offset(amount) { return new this().ref(this).offset(amount); }
  
  static orderBy(order) { return new this().ref(this).orderBy(order); }
  
  static where(conditions, args) { return new this().ref(this).where(conditions, args); }

  setup() {}

  setAttribute(attribute, type) {
    
    this.#attributes[attribute] = { type: type, value: null };
    
    this[attribute] = null; 
  
  }

  validate(attribute, validator) { 
    
    this.#validationHooks.push({
      attribute: attribute,
      validator: validator
    });
  }

  beforeSave(method) {
    if (!this.#beforeSaveHooks[method]) {

      this.#beforeSaveHooks.push(method);
    }
  }
  
  afterSave(method) {
    if (!this.#afterSaveHooks[method]) {

      this.#afterSaveHooks.push(method);
    }
  }

  async all() {

    let query = `SELECT * FROM ${this.#tableName}`;

    let whereQuery = this.#whereQuery();

    query += whereQuery[0];
  
    if (this.#orderBy)
    {
      query += ` ORDER BY ${this.#orderBy}`;
    }

    if (this.#limit)
    {
      query += ` LIMIT ${this.#limit}`;
    }
    
    if (this.#offset)
    {
      query += ` OFFSET ${this.#offset}`;
    }
    
    query += ';';
  
    try {
      let results = [];

      const res = await Client.query(query, whereQuery[1]);

      res.rows.forEach((row) => {

        let obj = new this.#ref();
        
        obj.#setMassAttributes(row);
        
        obj.#persisted = true;
        
        results.push(obj);
      });
  
      return results;
    } 
    catch (err) {
      throw new Error(err);
    }
  }

  async save() {
    
    this.#reloadAttributes();
    
    this.#runBeforeSaveHooks();
    
    this.#checkValidations();
  
    if (this.errors.length > 0) {
      return false;
    } 
    else 
    {
      
      let result = this.#persisted ? await this.#update() : await this.#insert();
      
      this.#runAfterSaveHooks();
      
      return result;
    }
  }  

  async destroy() {
    return await this.#destroy();
  }
  
  ref(obj) { this.#ref = obj; return this; }

  limit(amount) {
    this.#limit = amount;
    return this;
  }

  offset(amount) {
    this.#offset = amount;
    return this;
  }

  orderBy(order) {
    this.#orderBy = order;
    return this;
  }

  where(conditions, args) {
    if (typeof(conditions) === "string")
    {
      this.#where.push({ conditions: conditions, args: typeof(args) === "string" ? [args] : args });
    }
    else 
    {
      let pointer = this.#where.map((w) => w.args.length).reduce((a, c) => a + c, 0) + 1;

      for (let cond in conditions) {
        let args = conditions[cond];
        this.#where.push({ conditions: `${cond} = $${pointer++}`, args: typeof(args) === "string" ? [args] : args });
      }
    }

    return this;
  }

  getAttributesArray(attribute)
  {
    return this.#attributes[attribute].value;
  }

}

#setMassAttributes(attrs) {
  for (let attr in attrs) {
   
    if( attr == 'createdat')
    { 
      this.createdAt = attrs[attr];

      this.#attributes.createdAt.value = attrs[attr];
    }
    
    if( attr == 'updatedat')
    { 
      this.updatedAt = attrs[attr] 

      this.#attributes.updatedAt.value = attrs[attr];
    }

    if (this.#attributes[attr]) {
      this[attr] = attrs[attr];
      this.#attributes[attr].value = attrs[attr];
    }
  }
}

#reloadAttributes() {
  for (let attribute in this.#attributes) {
    if (this.#attributes[attribute].value != this[attribute] && !this.#changedAttributes.includes(attribute)) 
    {
      this.#changedAttributes.push(attribute);
    }
    this.#attributes[attribute].value = this[attribute];
  }
}

#runBeforeSaveHooks() {
  this.#beforeSaveHooks.forEach((m) => {

    this[m]();

    this.#reloadAttributes();
  });

  return this;
}

#runAfterSaveHooks() {
  this.#afterSaveHooks.forEach((m) => {
    this[m]();
  });

  return this;
}

#checkValidations() {
  this.#validationHooks.forEach((hook) => {
    if (Array.isArray(hook.validator)) {
      hook.validator.forEach((deepHook) => {
        if (typeof (deepHook) == "string") {
          this[deepHook]();
        } else {
          deepHook(v.attribute, this);
        }
      })
    } else if (typeof (hook.validator) == "string") {
      this[hook.validator]();
    } else {
      hook.validator(hook.attribute, this);
    }
  });
}

async #insert() {
  
  this.#attributes['createdAt'].value = 'NOW()';

  this.#attributes['updatedAt'].value = 'NOW()';

  let queryConstructors = {insertFields: [], pointers: [], valueFields: [], returnFields: []};

  let pointer = 1;
  for (let attrName in this.#attributes) {
    if (attrName === "id") {

      queryConstructors.returnFields.push(`${attrName}`);
    } 
    else {
      queryConstructors.insertFields.push(`${attrName}`);
      
      queryConstructors.pointers.push(`$${pointer++}`);
      
      queryConstructors.valueFields.push(this.#attributes[attrName].value);
      
      queryConstructors.returnFields.push(`${attrName}`);
    }
  }

  let query = `INSERT INTO ${this.#tableName} (${queryConstructors.insertFields.join(', ')}) VALUES 
  (${queryConstructors.pointers.join(', ')}) RETURNING ${queryConstructors.returnFields.join(', ')};`;

  try {
    let result = await Client.query(query, queryConstructors.valueFields);

    this.#setMassAttributes(result.rows[0]);

    this.#persisted = true;
    
    this.#changedAttributes = [];
    
    return true;
    
  } catch (err) {
    console.log('SQL ERROR', err);
    return false;
  }
}

async #update() {
  this.#attributes['updatedAt'].value = 'NOW()';

  this.#changedAttributes.push('updatedAt');

  let queryConstructors = { updateFields: [], valueFields: [], returnFields: [] };

  let pointer = 1;

  for (let attrName of this.#changedAttributes) {
    if (attrName === "id") {continue;}
    
    queryConstructors.updateFields.push(`${attrName} = $${pointer++}`);
    
    queryConstructors.valueFields.push(this.#attributes[attrName].value);
    
    queryConstructors.returnFields.push(`${attrName}`);

  }
  
  queryConstructors.valueFields.push(this.id); 

  let query = `UPDATE ${this.#tableName} SET ${queryConstructors.updateFields.join(', ')} WHERE 
  ${this.#tableName}.id = $${pointer} RETURNING ${queryConstructors.returnFields.join(', ')};`;

  try {
    let result = await Client.query(query, queryConstructors.valueFields);

    this.#setMassAttributes(result.rows[0]);

    this.#changedAttributes = [];
    return true;
  } catch (err) {
    console.log('SQL ERROR', err);
    return false;
  }
}

async #destroy() {
  if (this.#persisted) {
    try {
      let query = `DELETE FROM ${this.#tableName} WHERE id = $1;`;

      await Client.query(query, [this.id]);

      for (let attr in this.#attributes) {
        this[attr] = null;
        this.#attributes[attr].value = null;
      }
      this.#changedAttributes = [];

      return true;
    } catch (err) {
      console.log('SQL ERROR', err);
      return false;
    }
  } 
  else {
    return false;
  }
}

async #find(id) {
  return await this.__get(`SELECT * FROM ${this.#tableName} WHERE id = $1 LIMIT 1;`, [id]);
}

async first() {
  let whereQuery = this.#whereQuery();
  return await this.__get(`SELECT * FROM ${this.#tableName}${whereQuery[0]} ORDER BY id ASC LIMIT 1;`, whereQuery[1]);
}

async last() {
  let whereQuery = this.#whereQuery();
  return await this.__get(`SELECT * FROM ${this.#tableName}${whereQuery[0]} ORDER BY id DESC LIMIT 1;`, whereQuery[1]);
}

#whereQuery() {

  let args = [];

  if (this.#where.length > 0)
  {
    let where = [];

    this.#where.forEach((where) => {
      where.push(where.conditions);
      args = args.concat(where.args);
    });

    return [` WHERE ${where.join(' AND ')}`, args];

  } else {

    return ['', []];
  }
}

async __get(query, args)
{
  try {
    const res = await Client.query(query, args);
    this.#setMassAttributes(res.rows[0]);
    this.#persisted = true;
    return this;
  } catch (err) {
    throw new Error(err);
  }
}

}

export { Attributes, Validators, Base };
