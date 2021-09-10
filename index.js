const EVENT     = 0,
      FN_CALL   = 1,
      FN_RETURN = 2;

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
  
  fn = new Proxy(this, {
    get(target, fn) {
      return (...args) => {
        const curid = target.id++;
        const p = new Promise(resolve => {
          target.promises[curid] = resolve;
        });
        target.onsend([FN_CALL, curid, fn, args]);
        return p;
      }
    }
  });

  emit(event, mesg) {
    this.onsend([EVENT, event, mesg]);
  }

  define(fns) {
    this.functions = fns;
  }

  async feed(frame) {
    switch (frame[0]) {
      case EVENT: {
        const [, e, payload] = frame;
        for (let i = 0; i < (this.listeners[e]?.length ?? 0); ++i) {
          this.listeners[e][i](payload);
        }
        break;
      };

      case FN_CALL: {
        const [, id, fn, args] = frame;
        this.onsend([FN_RETURN, id, await this.functions[fn](...args)]);
        break;
      };

      case FN_RETURN: {
        const [, id, retval] = frame;
        this.promises[id](retval);
        delete this.promises[id];
        break;
      };
    }
  }

  onsend = mesg => {};
}; 

module.exports = { Bridge };