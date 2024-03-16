import { describe, it, expect } from "vitest";
import { asynk } from "./main.js";

const unfold = (fn, seed) => {
	const result = [];
	let val = fn(seed);
	while (val) {
		result.push(val[0]);
		val = fn(val[1]);
	}
	return result;
};
const getNumberBetween = (min, max) =>
	min + Math.floor(Math.random() * (max - min + 1));

const timeout = (x, resolve = true) =>
	new Promise((res, rej) => setTimeout(resolve ? res : rej, 0, x));

const chars = unfold(
	(n) => (n < 123 ? [n === 90 ? 97 : n, n + 1] : false),
	65,
).map((c) => String.fromCharCode(c));
const getRandomString = () =>
	[...Array(6)]
		.map((x) => chars[getNumberBetween(0, chars.length - 1)])
		.join("");

const add = (a, b) => a + b;
const mul = (a, b) => a * b;
const pwr = (a, b) => a ** b;
const mod = (a, b) => a % b;
const div = (a, b) => Math.floor(a / b);

const ops = [add, mul, pwr, mod, div];
const getRandomOp = () => ops[Math.floor(Math.random() * ops.length)];

const loop =
	(iterations = 10) =>
	async (f) => {
		for (let i = 0; i < iterations; i += 1) {
			await f();
		}
	};

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
	it("Should throw an error if a non-Promise is yielded", () => {
		const result = () =>
			asynk(function* () {
				yield 1;
			});
		expect(result).toThrow();
	});
	it("Should return a Promise of undefined if only `return` is used", async () => {
		const result = asynk(function* () {
			return;
		});
		expect(result).toBeInstanceOf(Promise);
		await expect(result).resolves.toBe(undefined);
	});
	it("Should return a Promise of x if a resolved Promise of x is returned", async () => {
		const randomLimit = getNumberBetween(20, 80);
		await loop(randomLimit)(async () => {
			const expected = getNumberBetween(2, 100);
			const result = asynk(function* () {
				return Promise.resolve(expected);
			});
			expect(result).toBeInstanceOf(Promise);
			await expect(result).resolves.toBe(expected);
		});
	});
	it("Should return a Promise if a non-Promise is returned", async () => {
		const randomLimit = getNumberBetween(20, 80);
		await loop(randomLimit)(async () => {
			const expected = getNumberBetween(2, 100);
			const result = asynk(function* () {
				return expected;
			});
			expect(result).toBeInstanceOf(Promise);
			await expect(result).resolves.toBe(expected);
		});
	});
});

describe("Yielding values", () => {
	it("Should resolve a yielded value and make it available in the generator body", async () => {
		const randomLimit = getNumberBetween(20, 80);
		await loop(randomLimit)(async () => {
			const expected = getNumberBetween(2, 100);
			const result = asynk(function* () {
				const value = yield Promise.resolve(expected);
				expect(value).toBe(expected);
				return value;
			});
			expect(result).toBeInstanceOf(Promise);
			await expect(result).resolves.toBe(expected);
		});
	});

	it("Should work with multiple yields", async () => {
		const randomLimit = getNumberBetween(20, 80);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const inputA = getNumberBetween(2, 100);
			const inputB = getNumberBetween(2, 100);
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

	it("Should handle the case of a Promise being returned", async () => {
		const randomLimit = getNumberBetween(20, 80);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const inputA = getNumberBetween(2, 100);
			const inputB = getNumberBetween(2, 100);
			const expected = op(inputA, inputB);
			const result = asynk(function* () {
				const a = yield Promise.resolve(inputA);
				const b = yield Promise.resolve(inputB);
				const c = op(a, b);
				expect(a).toBe(inputA);
				expect(b).toBe(inputB);
				expect(c).toBe(expected);
				return Promise.resolve(c);
			});
			expect(result).toBeInstanceOf(Promise);
			await expect(result).resolves.toBe(expected);
		});
	});

	it("Should work when using timeouts", async () => {
		const randomLimit = getNumberBetween(20, 80);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const expectedA = getNumberBetween(2, 100);
			const expectedB = getNumberBetween(2, 100);
			const expected = op(expectedA, expectedB);
			const result = asynk(function* () {
				const a = yield timeout(expectedA);
				const b = op(a, expectedB);
				const c = yield timeout(b);
				expect(c).toBe(expected);
				return c;
			});
			await expect(result).resolves.toBe(expected);
		});
	});
});

describe("Errors and Rejections", () => {
	it("Should not throw in place", async () => {
		const randomLimit = getNumberBetween(5, 10);
		await loop(randomLimit)(async () => {
			const err = new Error(getRandomString());
			const result = () =>
				asynk(function* () {
					throw err;
				});
			expect(result).not.toThrow();
		});
	});

	it("Should handle thrown errors as rejections", async () => {
		const randomLimit = getNumberBetween(5, 10);
		await loop(randomLimit)(async () => {
			const err = new Error(getRandomString());
			const result = asynk(function* () {
				throw err;
			});
			await expect(result).rejects.toEqual(err);
		});
	});

	it("Should not throw an error when there is a resolved Promise", async () => {
		const randomLimit = getNumberBetween(5, 10);
		await loop(randomLimit)(async () => {
			const result = (str) =>
				asynk(function* () {
					const a = yield timeout(str);
					return a;
				});
			expect(result).not.toThrow();
		});
	});

	it("Should reject right away when yielding a rejected Promise", async () => {
		const randomLimit = getNumberBetween(10, 30);
		await loop(randomLimit)(async () => {
			const str1 = getRandomString();
			const str2 = getRandomString();
			const str3 = getRandomString();
			const expected = str2;
			const result = (s1, s2, s3) =>
				asynk(function* () {
					const a = yield timeout(str1);
					const b = yield timeout(str2, false);
					expect(b).not.toBeDefined();
					const c = yield timeout(str2);
					expect(c).not.toBeDefined();
					return `${a} ${b + c}`;
				});
			expect(result).not.toThrow();
			await expect(result(str1, str2, str3)).rejects.toBe(expected);
		});
	});

	it("Should catch rejected promises as errors with try/catch", async () => {
		const randomLimit = getNumberBetween(10, 30);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const inputA = getNumberBetween(2, 100);
			const inputB = getNumberBetween(2, 100);
			const unexpected = op(op(inputA, inputA), inputB);
			const expected = getRandomString();
			const result = (x, y, operation) =>
				asynk(function* () {
					try {
						const a = yield timeout(x);
						const b = yield timeout(x, false);
						const c = yield timeout(y);
						return operation(operation(a, b), c);
					} catch (_) {
						return expected;
					}
				});
			expect(result).not.toThrow();
			await expect(result(inputA, inputB, op)).resolves.toBe(expected);
			await expect(result(inputA, inputB, op)).resolves.not.toBe(unexpected);
		});
	});

	it("Should catch the _value_ of rejected promises as errors with try/catch", async () => {
		const randomLimit = getNumberBetween(10, 20);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const expected = getNumberBetween(2, 100);
			const inputB = getNumberBetween(2, 100);
			const result = (x, y, operation) =>
				asynk(function* () {
					try {
						const a = yield timeout(x);
						const b = yield timeout(x, false);
						const c = yield timeout(y);
						return operation(a, operation(b, c));
					} catch (err) {
						return err;
					}
				});
			expect(result).not.toThrow();
			await expect(result(expected, inputB, op)).resolves.toBe(expected);
		});
	});

	it("Should reject a rethrown rejection", async () => {
		const randomLimit = getNumberBetween(10, 20);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const expected = getNumberBetween(2, 100);
			const inputB = getNumberBetween(2, 100);
			const result = (x, y, operation) =>
				asynk(function* () {
					try {
						const a = yield timeout(x, false);
						const b = yield timeout(y);
						return operation(a, b);
					} catch (err) {
						throw err;
					}
				});
			expect(result).not.toThrow();
			await expect(result(expected, inputB, op)).rejects.toBe(expected);
		});
	});
});

describe("Special case yields", () => {
	const doOpGen = function* (op, a, b) {
		const n = yield Promise.resolve(a);
		const n2 = yield Promise.resolve(b);
		return op(n, n2);
	};

	const doOpAsynk = (op, a, b) =>
		function* () {
			const n = yield Promise.resolve(a);
			const n2 = yield Promise.resolve(b);
			return op(n, n2);
		};

	it("Should handle yield*", async () => {
		const randomLimit = getNumberBetween(10, 20);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const inputA = getNumberBetween(2, 100);
			const inputB = getNumberBetween(2, 100);
			const expected = op(inputA, op(inputA, inputB));
			const result = asynk(function* () {
				const a = yield* doOpGen(op, inputA, inputB);
				return op(inputA, a);
			});
			await expect(result).resolves.toBe(expected);
		});
	});

	it("Should handle yielding other asynk results", async () => {
		const randomLimit = getNumberBetween(10, 20);
		await loop(randomLimit)(async () => {
			const op = getRandomOp();
			const inputA = getNumberBetween(2, 100);
			const inputB = getNumberBetween(2, 100);

			const expected = op(inputA, op(inputA, inputB));
			const result = asynk(function* () {
				const a = yield asynk(doOpAsynk(op, inputA, inputB));
				const res = op(inputA, a);
				return res;
			});
			await expect(result).resolves.toBe(expected);
		});
	});
});

describe("Real use case simulation", () => {
	const ages = [
		getNumberBetween(25, 50),
		getNumberBetween(25, 50),
		getNumberBetween(25, 50),
		getNumberBetween(25, 50),
		getNumberBetween(25, 50),
	];
	const experience = [
		getNumberBetween(3, 40),
		getNumberBetween(3, 40),
		getNumberBetween(3, 40),
		getNumberBetween(3, 40),
		getNumberBetween(3, 40),
	];
	const users = [
		{
			name: "David",
			age: ages[0],
			experience: experience[0],
			colleagues: [2, 4],
		},
		{ name: "Ted", age: ages[1], experience: experience[1], colleagues: [3] },
		{
			name: "Jenn",
			age: ages[2],
			experience: experience[2],
			colleagues: [0, 4],
		},
		{
			name: "Miguel",
			age: ages[3],
			experience: experience[3],
			colleagues: [1],
		},
		{
			name: "Igor",
			age: ages[4],
			experience: experience[4],
			colleagues: [0, 2],
		},
	];

	it("Should resolve finding a user by id that exists", async () => {
		const randomLimit = getNumberBetween(10, 40);
		await loop(randomLimit)(async () => {
			const errStr = getRandomString();
			const getUserById = (id) =>
				new Promise((res, rej) =>
					setTimeout(users[id] ? res : rej, 0, users[id] ?? errStr),
				);

			const userID = getNumberBetween(0, users.length - 1);
			const expected =
				users[userID].experience +
				users[userID].colleagues.map((id) => users[id].experience).reduce(add);

			const result = asynk(function* () {
				const user = yield getUserById(userID);
				if (user.colleagues.length > 0) {
					// userId[]
					const ids = user.colleagues;
					// user[]
					const colleagues = yield Promise.all(ids.map(getUserById));
					const sumColleagues = colleagues.reduce(
						(acc, x) => acc + x.experience,
						0,
					);
					return sumColleagues + user.experience;
				}
				return user.experience;
			});
			await expect(result).resolves.toBe(expected);
		});
	});

	it("Should resolve when there is a valid id, and reject when not", async () => {
		const randomLimit = getNumberBetween(10, 40);
		await loop(randomLimit)(async () => {
			const errStr = getRandomString();
			const userID = getNumberBetween(0, users.length + users.length);
			const getUserById = (id) =>
				new Promise((res, rej) =>
					setTimeout(users[id] ? res : rej, 0, users[id] ?? errStr),
				);

			const valid = userID < users.length;

			const expected = valid
				? users[userID].experience +
				  users[userID].colleagues.map((id) => users[id].experience).reduce(add)
				: errStr;

			const result = asynk(function* () {
				const user = yield getUserById(userID);
				if (user.colleagues.length > 0) {
					// userId[]
					const ids = user.colleagues;
					// user[]
					const colleagues = yield Promise.all(ids.map(getUserById));
					const sumColleagues = colleagues.reduce(
						(acc, x) => acc + x.experience,
						0,
					);
					return sumColleagues + user.experience;
				}
				return user.experience;
			});
			if (valid) {
				await expect(result).resolves.toBe(expected);
			} else {
				await expect(result).rejects.toEqual(expected);
			}
		});
	});
});

describe("Direct comparisons to async functions", () => {
	const makeReturningAsynk = (v, except) =>
		asynk(function* () {
			if (except) {
				throw except;
			}
			return v;
		});
	const makeResolvingAsynk = (v, except) =>
		asynk(function* () {
			if (except) {
				throw except;
			}
			const a = yield Promise.resolve(v);
			const b = yield Promise.resolve(v);
			const c = yield Promise.resolve(v);
			return a + b + c;
		});
	const makeRejectingAsynk = (v, except) =>
		asynk(function* () {
			if (except) {
				throw except;
			}
			const a = yield Promise.resolve(v);
			const b = yield Promise.reject(v);
			const c = yield Promise.resolve(v);
			return a + b + c;
		});

	const makeReturningAsync = async (v, except) => {
		if (except) {
			throw except;
		}
		return v;
	};
	const makeResolvingAsync = async (v, except) => {
		if (except) {
			throw except;
		}
		const a = await Promise.resolve(v);
		const b = await Promise.resolve(v);
		const c = await Promise.resolve(v);
		return a + b + c;
	};
	const makeRejectingAsync = async (v, except) => {
		if (except) {
			throw except;
		}
		const a = await Promise.resolve(v);
		const b = await Promise.reject(v);
		const c = await Promise.resolve(v);
		return a + b + c;
	};
	it("should have the same results", async () => {
		const n = getNumberBetween(2, 100);
		const str = getRandomString();
		const errorStr = getRandomString();
		const errorMsg = getRandomString();
		const asks = [
			() => makeReturningAsynk(n),
			() => makeReturningAsynk(str),
			() => makeResolvingAsynk(n),
			() => makeResolvingAsynk(str),
			() => makeReturningAsynk(n, errorStr),
			() => makeReturningAsynk(n, new Error(errorMsg)),
			() => makeResolvingAsynk(n, errorStr),
			() => makeResolvingAsynk(n, new Error(errorMsg)),
			() => makeRejectingAsynk(n),
			() => makeRejectingAsynk(str),
			() => makeRejectingAsynk(n, errorStr),
			() => makeRejectingAsynk(n, new Error(errorMsg)),
		];
		const ascs = [
			() => makeReturningAsync(n),
			() => makeReturningAsync(str),
			() => makeResolvingAsync(n),
			() => makeResolvingAsync(str),
			() => makeReturningAsync(n, errorStr),
			() => makeReturningAsync(n, new Error(errorMsg)),
			() => makeResolvingAsync(n, errorStr),
			() => makeResolvingAsync(n, new Error(errorMsg)),
			() => makeRejectingAsync(n),
			() => makeRejectingAsync(str),
			() => makeRejectingAsync(n, errorStr),
			() => makeRejectingAsync(n, new Error(errorMsg)),
		];

		for (let i = 0; i < asks.length; i += 1) {
			let k;
			let kErr;
			let c;
			let cErr;
			try {
				k = await asks[i]();
			} catch (err) {
				kErr = err;
			}
			try {
				c = await ascs[i]();
				expect(k).toBe(c);
			} catch (err) {
				cErr = err;
				expect(kErr).toStrictEqual(cErr);
			}
		}
	});

	it("Should both handle thrown errors as rejections", async () => {
		const n = getNumberBetween(2, 100);
		const errorStr = getRandomString();

		expect(() => makeReturningAsync(n, errorStr)).not.toThrow();

		await expect(makeReturningAsynk(n, errorStr)).rejects.toBe(errorStr);
		await expect(makeReturningAsync(n, errorStr)).rejects.toBe(errorStr);
	});
});
