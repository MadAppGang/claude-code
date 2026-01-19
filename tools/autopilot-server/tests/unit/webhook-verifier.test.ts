/**
 * Unit tests for WebhookVerifier
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { createHmac } from "crypto";
import { WebhookVerifier } from "../../src/services/webhook-verifier";

const TEST_SECRET = "test-webhook-secret";

function createSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

describe("WebhookVerifier", () => {
  let verifier: WebhookVerifier;

  beforeEach(() => {
    verifier = new WebhookVerifier(TEST_SECRET, false);
  });

  test("accepts valid signature", () => {
    const payload = '{"action":"create","type":"Issue"}';
    const signature = createSignature(payload, TEST_SECRET);

    expect(verifier.verify(payload, signature)).toBe(true);
  });

  test("rejects invalid signature", () => {
    const payload = '{"action":"create","type":"Issue"}';
    const invalidSignature = createSignature(payload, "wrong-secret");

    expect(verifier.verify(payload, invalidSignature)).toBe(false);
  });

  test("rejects missing signature", () => {
    const payload = '{"action":"create","type":"Issue"}';

    expect(verifier.verify(payload, null)).toBe(false);
  });

  test("accepts missing signature in dev mode", () => {
    const devVerifier = new WebhookVerifier(TEST_SECRET, true);
    const payload = '{"action":"create","type":"Issue"}';

    expect(devVerifier.verify(payload, null)).toBe(true);
  });

  test("rejects old timestamps", () => {
    const payload = '{"action":"create","type":"Issue"}';
    const signature = createSignature(payload, TEST_SECRET);
    // Linear sends webhookTimestamp as UNIX milliseconds in body
    const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago

    expect(verifier.verify(payload, signature, oldTimestamp)).toBe(false);
  });

  test("accepts recent timestamps", () => {
    const payload = '{"action":"create","type":"Issue"}';
    const signature = createSignature(payload, TEST_SECRET);
    const recentTimestamp = Date.now();

    expect(verifier.verify(payload, signature, recentTimestamp)).toBe(true);
  });

  test("prevents replay attacks", () => {
    const payload = '{"action":"create","type":"Issue"}';
    const signature = createSignature(payload, TEST_SECRET);

    // First request should pass
    expect(verifier.verify(payload, signature)).toBe(true);

    // Replay should fail
    expect(verifier.verify(payload, signature)).toBe(false);
  });

  test("rejects future timestamps", () => {
    const payload = '{"action":"create","type":"Issue"}';
    const signature = createSignature(payload, TEST_SECRET);
    // 5 minutes in future (exceeds 1 min tolerance)
    const futureTimestamp = Date.now() + 5 * 60 * 1000;

    expect(verifier.verify(payload, signature, futureTimestamp)).toBe(false);
  });
});
