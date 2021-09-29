declare type EventCallback = (arg: any) => any;
declare type AsyncFunction = (...args: any[]) => Promise<any>;

export declare class Bridge<RemoteFuncs = any, RemoteEvents = any, LocalFuncs = any, LocalEvents = any> {
  public on(event: RemoteEvents, cb: EventCallback): void;
  public once(event: RemoteEvents, cb: EventCallback): void;
  public off(event: RemoteEvents, cb: EventCallback): void;
  public emit(event: LocalEvents, mesg: any): void;
  public fn: RemoteFuncs;
  public define(funcs: LocalFuncs);

  public feed(frame: Array<any>): Promise<void>;
  public onsend: (mesg: any) => void;
}