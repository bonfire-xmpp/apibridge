# Bonfire API Bridge

## Purpose

The purpose of this module is to provide a minimal event and function call layer
on top of generic duplex streams. Events can be listened on using the standard
Node `EventEmitter` interface (on/off/once/emit), and asynchronous function 
calls can be made which resolve to their return value. The transport is 
delegated to user code, so the interface works whether you're sending raw 
JavaScript objects (as is the case in web workers and Node IPC) or sending 
msgpack/JSON over the network.

## Interface

The library exports a single class:

```ts
class Bridge {
  // --- Event API --- //

  // Listens on a given event using a callback.
  //   event:    Event name to listen on.
  //   callback: Callback to receive events `e`.
  on(event: string, callback: (e?: any) => void): void;

  // Removes one listener or all listeners from a selected event.
  //   event:    Event name to remove listener from.
  //   callback: The callback to remove. If none are provided, 
  //             all callbacks are cleared from the given event.
  off(event: string, callback?: (e?: any) => void): void;
  
  // Listens on a given event a maximum of one time.
  //   event:    Event namme to listen on.
  //   callback: Callback to receive events `e`.
  once(event: string, callback: (e?: any) => void): void;

  // Emits an event to all remote listeners.
  //   event: Name of the event to trigger.
  //   e:     Event payload.
  emit(event: string, e: any): void;

  // --- Function API --- //

  // Defines a set of named functions which can be called remotely.
  define(funcs: { 
    [funcname: string]: (...args: any) => any 
  }): void;

  // A proxy mapping remote function names to callable local async
  // functions. Exceptions thrown by remote functions will cause 
  // the returned promise to be rejected.
  fn: { 
    [funcname: string]: (...args: any) => Promise<any> 
  };

  // --- Channel Input/Output --- //

  // Causes the bridge to handle an object received from the remote 
  // end of the channel.
  //   frame: The frame received through the channel.
  async feed(frame: Array<any>): void;

  // The function called by the bridge internally to send a message 
  // through the channel. This should be implemented by the user.
  onsend: (mesg: Array<any>) => void = mesg => {};
}
```

## Example Code

```js
const { Bridge } = require("@bonfire-xmpp/apibridge");

const local = new Bridge();
const remote = new Bridge();

local.onsend = data => {
  remote.feed(data);
};
remote.onsend = data => {
  local.feed(data);
};

// --- Function Calls --- //

dst.define({
  add(x, y) {
    return x + y;
  }
});

local.fn.add(1, 2).then(result => console.log(result));
//> 3

// --- Events --- //

// listen specifically to my-event
local.on("my-event", e => {
  console.log(e);
});
// listen to all events
local.on("*", (ename, e) => {
  console.log(ename, e);
});
remote.emit("my-event", 4);
//> 4
//> my-event 4
```