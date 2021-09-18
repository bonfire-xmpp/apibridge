declare type EventCallback = (arg: any) => any;
declare type AsyncFunction = (...args: any[]) => Promise<any>;

export declare class Bridge<Remote> {
  public on(event: string, cb: EventCallback): void;
  public once(event: string, cb: EventCallback): void;
  public off(event: string, cb: EventCallback): void;
  public emit(event: string, mesg: any): void;
  public fn: Remote;
  public define(funcs: { [funcname: string]: AsyncFunction });

  public feed(frame: Array<any>): Promise<void>;
  public onsend: (mesg: any) => void;
}