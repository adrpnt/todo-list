import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Gera um hash no formato "salt:hash" (hex) usando scrypt. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);

  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");

  if (!saltHex || !keyHex) {
    return false;
  }

  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length,
  );

  return timingSafeEqual(expected, actual);
}
