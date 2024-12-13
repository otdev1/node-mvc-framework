import { StringDecoder } from 'string_decoder';
import qs from 'querystring';

const BodyParser = (request, response, next) => {
  const decoder = new StringDecoder('utf-8');
  let payload = '';
  if (!request.controller.data.params)
  {
    request.controller.data.params = {}; 
  }

  request.on('data', (data) => {
    payload += decoder.write(data);
  });

  request.on('end', () => {
    payload += decoder.end();
    request.controller.data.params = { ...request.controller.data.params, ...qs.parse(payload) };
    next();
  });
}

export default BodyParser;