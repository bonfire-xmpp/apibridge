const EVENT     = 0,
      FN_CALL   = 1,
      FN_RETURN = 2,
      FN_THROW  = 3;

function callPromise(bridge, path) {
  const inner = (path) => new Proxy(function() {}, {
    get(_target, prop) {
      return inner(path.length ? path + "." + prop : prop);
    },
    apply(_target, _thisarg, args) {
      const curid = bridge.id++;
      const p = new Promise((resolve, reject) => {
        bridge.promises[curid] = { resolve, reject };
      });
      bridge.onsend([FN_CALL, curid, path, args]);
      return p;
    },
  });
  return inner(path);
}

function flatten(obj) {
  const stack = [[obj, []]];
  const flatobj = {};
  while (stack.length) {
    const top = stack.pop();
    for (const key in top[0]) {
      switch (typeof top[0][key]) {
        case "object": {
          stack.push([top[0][key], top[1].concat([key])]);
          break;
        };
        case "function": {
          flatobj[top[1].concat([key]).join(".")] = top[0][key];
          break;
        };
      }
    }
  }
  return flatobj;
}

class Bridge {
  id = 0;
  listeners = {};
  promises = {};
  functions = {};

  on(event, cb) {
    (this.listeners[event] ??= []).push(cb);
  }
  
  once(event, cb) {
    const callback = (...args) => 
      (this.off(event, callback), cb(...args));
    (this.listeners[event] ??= []).push(callback);
  }
  
  off(event, cb) {
    if (cb && this.listeners[event].length) {
      this.listeners[event] = this.listeners[event].filter(xcb => xcb !== cb);
    } else {
      delete this.listeners[event];
    }
  }
  
  fn = callPromise(this, []);

  emit(event, mesg) {
    this.onsend([EVENT, event, mesg]);
  }

  define(fns) {
    this.functions = flatten(fns);
  }

  async feed(frame) {
    switch (frame[0]) {
      case EVENT: {
        const [, e, payload] = frame;
        for (let i = 0; i < (this.listeners[e]?.length ?? 0); ++i) {
          this.listeners[e][i](payload);
        }
        if (this.listeners["*"]?.length) {
          for (let i = 0; i < this.listeners["*"].length; ++i) {
            this.listeners["*"][i](e, payload);
          }
        }
        break;
      };

      case FN_CALL: {
        const [, id, fn, args] = frame;
        try {
          this.onsend([FN_RETURN, id, await this.functions[fn](...args)]);
        } catch (e) {
          this.onsend([FN_THROW, id, e]);
        }
        break;
      };

      case FN_RETURN: {
        const [, id, retval] = frame;
        this.promises[id].resolve(retval);
        delete this.promises[id];
        break;
      };

      case FN_THROW: {
        const [, id, error] = frame;
        this.promises[id].reject(error);
        delete this.promises[id];
        break;
      }
    }
  }

  onsend = () => {};
}; 

module.exports = { Bridge };