/* global globalThis */
/*
  Versleuteling voor recepten uit kookboeken.

  De inhoud (ingrediënten + bereiding) wordt in de browser versleuteld met
  AES-256-GCM. De sleutel komt uit het wachtwoord via PBKDF2 (SHA-256).
  In de repo en op de site staat alleen de versleutelde tekst; zonder
  wachtwoord is het recept niet te lezen, ook niet in de broncode.
*/

const ITERATIONS = 250000;

const subtle = () => globalThis.crypto.subtle;

function toBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(text) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

async function deriveKey(password, salt, iterations) {
  const material = await subtle().importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Versleutel een willekeurig JSON-object met een wachtwoord. */
export async function encryptJSON(value, password, iterations = ITERATIONS) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations);
  const data = await subtle().encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(value))
  );
  return {
    v: 1,
    iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(data)),
  };
}

/**
 * Ontsleutel. Gooit een fout ("Onjuist wachtwoord") als het wachtwoord niet klopt.
 */
export async function decryptJSON(payload, password) {
  try {
    const key = await deriveKey(password, fromBase64(payload.salt), payload.iterations || ITERATIONS);
    const plain = await subtle().decrypt(
      { name: "AES-GCM", iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.data)
    );
    return JSON.parse(new TextDecoder().decode(plain));
  } catch (e) {
    throw new Error("Onjuist wachtwoord");
  }
}

// Controlewaarde in src/data/lock.json, zodat alle boekrecepten hetzelfde wachtwoord gebruiken
export const LOCK_CHECK = "koken-met-jasper";

export async function checkPassword(lock, password) {
  if (!lock || !lock.data) return false;
  try {
    return (await decryptJSON(lock, password)) === LOCK_CHECK;
  } catch {
    return false;
  }
}
