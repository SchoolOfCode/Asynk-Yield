import { describe, it, expect } from "vitest";
import { asynk } from "./main.js";

const getVal = () => Math.floor(Math.random() * 100);
const timeout = (x) => new Promise((res, rej) => setTimeout(res, 0, x));

describe("Works with Promises", () => {
	it("Should return a Promise if only `yield` is used", () => {
		const result = asynk(function* () {
			yield;
		});
		expect(result).toBeInstanceOf(Promise);
	});
	it("Should return a Promise if a Promise is yielded", () => {
		const result = asynk(function* () {
			yield Promise.resolve(1);
		});
		expect(result).toBeInstanceOf(Promise);
	});
	it("Should throw an error if a non-Promise is yielded", () => {
		const result = () =>
			asynk(function* () {
				yield 1;
			});
		expect(result).toThrow();
	});
	it("Should return a Promise if only `return` is used", () => {
		const result = asynk(function* () {
			return;
		});
		expect(result).toBeInstanceOf(Promise);
	});
	it("Should return a Promise if a Promise is returned", () => {
		const result = asynk(function* () {
			return Promise.resolve(1);
		});
		expect(result).toBeInstanceOf(Promise);
	});
	it("Should return a Promise if a non-Promise is returned", () => {
		const result = asynk(function* () {
			return 10;
		});
		expect(result).toBeInstanceOf(Promise);
	});
});

describe("Yielding values", () => {
	it("Should have access to the Promise value once resolved", async () => {
		const actualA = getVal();
		const result = asynk(function* () {
			const value = yield Promise.resolve(actualA);
			return value;
		});
		await expect(result).resolves.toBe(actualA);
	});

	it("Should be able to get the results of two Promises and return their sum", async () => {
		const actualA = getVal();
		const actualB = getVal();
		const actualResult = actualA + actualB;
		const result = asynk(function* () {
			const a = yield Promise.resolve(actualA);
			const b = yield Promise.resolve(actualB);
			return a + b;
		});
		await expect(result).resolves.toBe(actualResult);
	});

	it("Should handle the case of a Promise being returned", async () => {
		const actualA = getVal();
		const actualB = getVal();
		const actualResult = actualA + actualB;
		const result = asynk(function* () {
			const a = yield Promise.resolve(actualA);
			const b = yield Promise.resolve(actualB);
			return Promise.resolve(a + b);
		});
		await expect(result).resolves.toBe(actualResult);
	});

	it("Should work when using timeouts", async () => {
		const actualA = getVal();
		const actualB = getVal();
		const actualResult = actualA + actualB;
		const result = asynk(function* () {
			const a = yield timeout(actualA);
			const b = yield timeout(a + actualB);
			return b;
		});
		await expect(result).resolves.toBe(actualResult);
	});
});

describe("Errors", () => {
	const rejectionMessage = "REJECTION!";
	const timeoutResolve = (x) =>
		new Promise((res, rej) => setTimeout(res, 0, x));
	const timeoutReject = () =>
		new Promise((res, rej) => setTimeout(rej, 0, rejectionMessage));

	it("Should not throw an error when there is a resolved Promise", async () => {
		const result = asynk(function* () {
			const a = yield timeoutResolve(66);
			return a;
		});
		await expect(result).resolves.not.toThrow();
	});

	it("Should throw an error when there is a rejected Promise", async () => {
		const result = asynk(function* () {
			const a = yield timeoutReject();
			return a;
		});
		await expect(result).rejects.toThrow();
	});

	it("Should not catch an error with try/catch when there is a resolved Promise", async () => {
		const actualA = getVal();
		const result = asynk(function* () {
			try {
				const a = yield timeoutResolve(actualA);
				return a;
			} catch (err) {
				return err;
			}
		});
		await expect(result).resolves.toBe(actualA);
	});

	it("Should catch errors with try/catch when there is a rejected Promise", async () => {
		const result = asynk(function* () {
			try {
				const a = yield timeoutReject();
				return a;
			} catch (err) {
				return err;
			}
		});
		await expect(result).resolves.toBeInstanceOf(Error);
	});

	it("Should throw the rejection argument as an Error", async () => {
		const result = asynk(function* () {
			try {
				const a = yield timeoutReject();
				return a;
			} catch (err) {
				return err;
			}
		});
		await expect(result).resolves.toEqual(new Error(rejectionMessage));
	});
});

describe("Special case yields", () => {
	const square = function* (v) {
		const n = yield Promise.resolve(v);
		const n2 = yield Promise.resolve(v);
		return n * n2;
	};

	const squareThunk = (v) =>
		function* () {
			const n = yield Promise.resolve(v);
			const n2 = yield Promise.resolve(v);
			return n * n2;
		};

	it("Should should handle yield*", async () => {
		const actualA = getVal();
		const actualB = getVal();
		const actualResult = actualA * actualA + actualB;
		const result = asynk(function* () {
			const a = yield* square(actualA);
			return a + actualB;
		});
		await expect(result).resolves.toBe(actualResult);
	});

	it("Should should handle yielding other asynk results", async () => {
		const actualA = getVal();
		const actualB = getVal();
		const actualResult = actualA * actualA + actualB;
		const result = asynk(function* () {
			const a = yield asynk(squareThunk(actualA));
			return a + actualB;
		});
		await expect(result).resolves.toBe(actualResult);
	});

	it("Should should handle yielding other asynk results", async () => {
		const actualA = getVal();
		const actualB = getVal();
		const actualResult = actualA * actualA + actualB;
		const result = asynk(function* () {
			const a = yield asynk(squareThunk(actualA));
			return a + actualB;
		});
		await expect(result).resolves.toBe(actualResult);
	});
});

describe("Real use case simulation", () => {
	const notFoundMessage = "No user with that ID!";
	const getUserById = (id) =>
		new Promise((res, rej) =>
			setTimeout(users[id] ? res : rej, 0, users[id] ?? notFoundMessage),
		);

	const users = [
		{ name: "David", age: 43, experience: 13, colleagues: [2, 4] },
		{ name: "Ted", age: 23, experience: 3, colleagues: [3] },
		{ name: "Jenn", age: 29, experience: 8, colleagues: [0, 4] },
		{ name: "Miguel", age: 38, experience: 19, colleagues: [1] },
		{ name: "Igor", age: 32, experience: 9, colleagues: [0, 2] },
	];

	it("Should resolve finding a user by id that exists", async () => {
		const input = 0;
		const result = asynk(function* () {
			const user = yield getUserById(input);
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
		await expect(result).resolves.toBe(30);
	});

	it("Should throw when trying to find a user by an id that does not exist", async () => {
		const input = 8;
		const result = asynk(function* () {
			const user = yield getUserById(input);
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
		await expect(result).rejects.toThrow();
		await expect(result).rejects.toEqual(new Error(notFoundMessage));
	});
});
