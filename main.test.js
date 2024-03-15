import { describe, it, expect } from "vitest";
import { asynk } from "./main.js";

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
	const timeout = (x) => new Promise((res, rej) => setTimeout(res, 0, x));
	it("Should have access to the Promise value once resolved", async () => {
		const result = asynk(function* () {
			const value = yield Promise.resolve(4);
			return value;
		});
		await expect(result).resolves.toBe(4);
	});

	it("Should be able to get the results of two Promises and return their sum", async () => {
		const result = asynk(function* () {
			const a = yield Promise.resolve(4);
			const b = yield Promise.resolve(5);
			return a + b;
		});
		await expect(result).resolves.toBe(9);
	});

	it("Should handle the case of a Promise being returned", async () => {
		const result = asynk(function* () {
			const a = yield Promise.resolve(4);
			const b = yield Promise.resolve(5);
			return Promise.resolve(a + b);
		});
		await expect(result).resolves.toBe(9);
	});

	it("Should work when using timeouts", async () => {
		const result = asynk(function* () {
			const a = yield timeout(11);
			const b = yield timeout(a + 3);
			return b;
		});
		await expect(result).resolves.toBe(14);
	});
});

describe("Errors", () => {
	const timeoutResolve = (x) =>
		new Promise((res, rej) => setTimeout(res, 0, x));
	const timeoutReject = () =>
		new Promise((res, rej) => setTimeout(rej, 0, "REJECTION!"));

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
		const result = asynk(function* () {
			try {
				const a = yield timeoutResolve(5);
				return a;
			} catch (err) {
				return err;
			}
		});
		await expect(result).resolves.toBe(5);
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
		await expect(result).resolves.toEqual(new Error("REJECTION!"));
	});
});

describe("Special case yields", () => {
	const inner = function* () {
		const n = yield Promise.resolve(10);
		return n + 5;
	};

	it("Should should handle yield*", async () => {
		const result = asynk(function* () {
			const a = yield* inner();
			return a + 7;
		});
		await expect(result).resolves.toBe(22);
	});

	it("Should should handle yielding other asynk results", async () => {
		const result = asynk(function* () {
			const a = yield asynk(inner);
			return a + 7;
		});
		await expect(result).resolves.toBe(22);
	});

	it("Should should handle yielding other asynk results", async () => {
		const result = asynk(function* () {
			const a = yield asynk(inner);
			return a + 7;
		});
		await expect(result).resolves.toBe(22);
	});
});

describe("Real use case simulation", () => {
	const getUserById = (id) =>
		new Promise((res, rej) =>
			setTimeout(
				users[id] ? res : rej,
				0,
				users[id] ?? "No user with that ID!",
			),
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
		await expect(result).rejects.toEqual(new Error("No user with that ID!"));
	});
});
