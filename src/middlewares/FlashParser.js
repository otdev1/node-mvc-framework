import nodeCookie from 'node-cookie';

const FlashParser = (request, response, next) => {
  const cookieSecret = 'mysecretcookiesecret';

  let allFlashCookies = nodeCookie.parse(request, cookieSecret, true);
  let flashCookies = {};
  for (let flash in allFlashCookies) {
    if (flash.substr(0, 9) === "_session_") {
      let name = flash.substr(9);
      if (allFlashCookies[`_sessiontokill_${name}`] == 0)
        flashCookies[name] = allFlashCookies[`_session_${name}`];
    }
  }

  const flashesEndWare = (request, response) => {
    let allFlashCookies = nodeCookie.parse(request, cookieSecret, true);
    for (let flash in allFlashCookies) {
      if (flash.substr(0, 15) === "_sessiontokill_") {
        let name = flash.substr(15);
        let sess = allFlashCookies[flash];
        if (sess == 0) {
          nodeCookie.create(response, `_sessiontokill_${name}`, 1, {
            maxAge: 60 * 60 * 24 * 7,
            path: "/"
          }, cookieSecret, true);
        } else {
          nodeCookie.clear(response, `_sessiontokill_${name}`);
          nodeCookie.clear(response, `_session_${name}`);
        }
      }
    }
  }

  request.controller.data.flash = {
    set: (name, val) => {
      nodeCookie.create(response, `_session_${name}`, val, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/"
      }, cookieSecret, true);
      nodeCookie.create(response, `_sessiontokill_${name}`, 0, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/"
      }, cookieSecret, true);
    },
    ...flashCookies
  };
  request.controller.templateData.flash = request.controller.data.flash;
  request.controller.endwares.push(flashesEndWare);
  next();
};

export default FlashParser;