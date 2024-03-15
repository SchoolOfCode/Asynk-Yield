# Ideas and their criticisms & comments
- A `compose all` variadic function that takes unary functions and wires them together to return a function that is the composition of them all.
  - Probably too simple
- A `transduce` function that works for any iterable.
  - Maybe not as interesting as putting the whole "Foldable" system together
- Implement a `concat` for linked lists
  - Decent idea, but perhaps not that interesting
- Implement a JSON parser
  - Would have to somehow disable access to `JSON.parse` 😏
- Implement `async/await` with generators
  - Probably the most interesting and educational when the intended users are given thought

# The plan
### Overview

Have the user implement an `asynk` (as in async/await) function with its single parameter being a generator function. 

The `asynk` function should:
  - Correctly handle generator yields on Promises
  - Return a Promise
  - Support try catch if one of the yielded Promises rejects.
  
What it might look like to use:
```javascript
// User :: { name: string, age: number, experience: number, colleagues: number[] }

const sumOfExperience = asynk(function* () {
  const input = 3;
  const user = yield getUserById(input);
  if (user.colleagues.length > 0) {
    // userId[]
    const ids = user.colleagues
    // user[]
    const colleagues = yield Promise.all(ids.map(getUserById));
    const sumColleagues = colleagues.reduce((acc, x) => acc + x.experience, 0);
    return sumColleagues + user.experience;
  }
  return user.experience
});
```

### What to test for

- Returns a Promise
- try/catch catches a rejected Promise
- "Applicative" style works (unrelated yields)
- "Monad" style works (feeding yields into one another)

### The preamble or story

You may have heard that async/await is just syntatic sugar in JS. Well, I'm sorry to have to report this, but the JavaScript factory has run out of sugar! We have no more async/await to give to users, so you'll have to re-implement it with a sugar alternative. Let's call it something legally distinct like `asynk` so that we don't get sued by Big Sugar.

Your task is to build a function that takes a generator factory that yields promises wherever there would have been an `await` before.

<-EXAMPLE HERE->

Remember, we want this to behave as similarly to async/await as is feasible, there will be some basic requirements!

<-REQUIREMENTS HERE->