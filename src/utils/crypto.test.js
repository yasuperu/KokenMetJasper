/**
 * @jest-environment node
 */
/* global globalThis */
import { webcrypto } from "crypto";
import { encryptJSON, decryptJSON, checkPassword, LOCK_CHECK } from "./crypto";

// Jest 27 geeft geen WebCrypto mee; de browser wel.
if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto;

test("versleutelen en ontsleutelen", async () => {
  const content = { ingredients: [{ id: "ui", name: "ui", amount: 1 }], instructions: ["Snijd {ui}."] };
  const payload = await encryptJSON(content, "geheim");
  expect(JSON.stringify(payload)).not.toContain("Snijd");
  expect(await decryptJSON(payload, "geheim")).toEqual(content);
  await expect(decryptJSON(payload, "fout")).rejects.toThrow("Onjuist wachtwoord");
});

test("wachtwoordcontrole", async () => {
  const lock = await encryptJSON(LOCK_CHECK, "geheim");
  expect(await checkPassword(lock, "geheim")).toBe(true);
  expect(await checkPassword(lock, "anders")).toBe(false);
  expect(await checkPassword({}, "geheim")).toBe(false);
});

test("afgeschermde bereiding met de sitesleutel", async () => {
  const { encryptSteps, decryptSteps } = require("./gate");
  const steps = ["Verwarm de oven voor.", "Bak {kroket}."];
  const payload = await encryptSteps(steps);
  expect(payload.iterations).toBe(1000);
  expect(JSON.stringify(payload)).not.toContain("oven");
  expect(await decryptSteps(payload)).toEqual(steps);
});
