import { describe, expect, test } from "bun:test";

import { parseIndexStatus } from "./status";

describe("parseIndexStatus", () => {
  test.each([
    ["355 chunks", "355 chunks"],
    ["355 symbols", "355 symbols"],
    ["exists=true\nfiles=20\nchunks=355\nlanguages=typescript", "355 chunks"],
    ["exists=true\nsymbols = 42\nmodel=local", "42 symbols"],
  ])("detects an indexed project from %j", (status, symbolCount) => {
    expect(parseIndexStatus(status)).toEqual({ indexed: true, symbolCount });
  });

  test.each([
    null,
    "",
    "No index found",
    "exists=false\nchunks=355",
    "exists=true\nfiles=20",
  ])("rejects a missing index from %j", (status) => {
    expect(parseIndexStatus(status)).toEqual({ indexed: false });
  });
});
