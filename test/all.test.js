const { Bridge } = require("../index");

test("listen to events", () => {
  expect.assertions(2);

  const src = new Bridge();
  const dst = new Bridge();
  src.onsend = dst.feed.bind(dst);
  
  const fn = jest.fn();
  dst.on("event", fn);
  dst.on("event", fn);
  src.emit("event", 4);

  expect(fn).toHaveBeenCalledWith(4);
  expect(fn).toHaveBeenCalledTimes(2);
});

test("emit without listener", () => {
  expect.assertions(1);

  try {
    const src = new Bridge();
    const dst = new Bridge();
    src.onsend = dst.feed.bind(dst);
    src.emit("event", null);
    expect(true).toBe(true);
  } catch (_) {}
});

test("event once", () => {
  expect.assertions(1);
  const src = new Bridge();
  const dst = new Bridge();
  src.onsend = dst.feed.bind(dst);

  const fn = jest.fn();

  dst.once("eventA", fn);

  src.emit("eventA", 1);
  src.emit("eventA", 2);

  expect(fn).toHaveBeenCalledTimes(1);
});

test("clear listeners", () => {
  expect.assertions(0);

  const src = new Bridge();
  const dst = new Bridge();
  src.onsend = dst.feed.bind(dst);

  dst.on("event", () => expect(true).toBe(true));
  dst.on("event", () => expect(true).toBe(true));
  dst.off("event");

  src.emit("event");
});

test("function call", async () => {
  expect.assertions(1);

  const src = new Bridge();
  const dst = new Bridge();
  src.onsend = dst.feed.bind(dst);
  dst.onsend = src.feed.bind(src);

  dst.define({
    async add(x, y) {
      return await (x + y);
    }
  });

  expect(
    await Promise.all([
      src.fn.add(1, 2),
      src.fn.add(3, 4),
    ])
  ).toEqual([3, 7]);
});