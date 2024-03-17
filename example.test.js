import { describe, it, expect } from "vitest";
import { asynk } from "./main.js";

const timeout = (x, resolve = true) =>
	new Promise((res, rej) => setTimeout(resolve ? res : rej, 0, x));

describe("Works with Promises", () => {
	it("Should return a Promise of undefined even if only `yield` is used", async () => {
		const result = asynk(function* () {
			yield;
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(undefined);
	});
	it("Should return a Promise of undefined even if a Promise of 1 is yielded", async () => {
		const result = asynk(function* () {
			yield Promise.resolve(1);
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(undefined);
	});
	it("Should return a Promise of undefined if only `return` is used", async () => {
		const result = asynk(function* () {
			return;
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(undefined);
	});
	it("Should return a Promise of 10 if a resolved Promise of 10 is returned", async () => {
		const expected = 10;
		const result = asynk(function* () {
			return Promise.resolve(expected);
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(expected);
	});
	it("Should return a Promise if a non-Promise is returned", async () => {
		const expected = 11;
		const result = asynk(function* () {
			return expected;
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(expected);
	});
});

describe("Yielding values", () => {
	it("Should resolve a yielded value and make it available in the generator body", async () => {
		const expected = 12;
		const result = asynk(function* () {
			const value = yield Promise.resolve(expected);
			expect(value).toBe(expected);
			return value;
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(expected);
	});

	it("Should work with multiple yields", async () => {
		const op = (a, b) => a + b;
		const inputA = 13;
		const inputB = 14;
		const expected = op(inputA, inputB);
		const result = asynk(function* () {
			const a = yield Promise.resolve(inputA);
			const b = yield Promise.resolve(inputB);
			const c = op(a, b);
			expect(a).toBe(inputA);
			expect(b).toBe(inputB);
			expect(c).toBe(expected);
			return c;
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(expected);
	});
});

describe("Errors and Rejections", () => {
	it("Should only throw in place if a non-Promise is yielded", () => {
		const result = () =>
			asynk(function* () {
				yield 1;
			});
		expect(result).toThrow();
	});

	it("Should not throw in place otherwise", async () => {
		const err = new Error("ERROR");
		const result = () =>
			asynk(function* () {
				throw err;
			});
		expect(result).not.toThrow();
	});

	it("Should handle thrown errors as rejections", async () => {
		const err = new Error("ERROR");
		const result = asynk(function* () {
			throw err;
		});
		await expect(result).rejects.toEqual(err);
	});

	it("Should reject right away when yielding a rejected Promise", async () => {
		const str1 = "Hello";
		const str2 = "World";
		const str3 = "!!";
		const expected = str2;
		const result = (s1, s2, s3) =>
			asynk(function* () {
				const a = yield timeout(str1);
				const b = yield timeout(str2, false);
				expect(b).not.toBeDefined();
				const c = yield timeout(str3);
				expect(c).not.toBeDefined();
				return `${a} ${b + c}`;
			});
		expect(result).not.toThrow();
		await expect(result(str1, str2, str3)).rejects.toBe(expected);
	});

	it("Should catch rejected promises as errors with try/catch", async () => {
		const mul = (a, b) => a * b;
		const inputA = 15;
		const inputB = 16;
		const unexpected = mul(mul(inputA, inputA), inputB);
		const expected = "REJECTION";
		const result = (x, y, op) =>
			asynk(function* () {
				try {
					const a = yield timeout(x);
					const b = yield timeout(x, false);
					const c = yield timeout(y);
					return op(op(a, b), c);
				} catch (_) {
					return expected;
				}
			});
		expect(result).not.toThrow();
		await expect(result(inputA, inputB, mul)).resolves.toBe(expected);
		await expect(result(inputA, inputB, mul)).resolves.not.toBe(unexpected);
	});

	it("Should catch the _value_ of rejected promises as errors with try/catch", async () => {
		const add = (a, b) => a + b;
		const expected = 17;
		const inputB = 18;
		const result = (x, y, op) =>
			asynk(function* () {
				try {
					const a = yield timeout(x);
					const b = yield timeout(x, false);
					const c = yield timeout(y);
					return op(a, op(b, c));
				} catch (err) {
					return err;
				}
			});
		expect(result).not.toThrow();
		await expect(result(expected, inputB, add)).resolves.toBe(expected);
	});
});
