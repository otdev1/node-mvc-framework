import PG from "pg";
import databaseConfig from '../config/database.js';

const Attributes = {
  String: "string",
  Integer: "integer",
  Float: "float",
  Primary: "primary",
  DateTime: "datetime"
};

const Validators = {
  PresenceOf: (attribute, model) => {
    if (model._attributes[attribute].value == null || model._attributes[attribute].value == undefined || 
        model._attributes[attribute].value == '') 
    {
      model.errors.push(`${attribute} should be present.`);
    }
  },
  IsString: (attribute, model) => {
    if (typeof (model._attributes[attribute].value) != "string") {
      model.errors.push(`${attribute} should be a string.`);
    }
  }
};

const Client = new PG.Pool(databaseConfig);

export { Attributes, Validators, Client };