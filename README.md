### Asynk/Yield

You may have heard that `async/await` is just syntatic sugar in JS. Well, I'm sorry to have to report this, but the JavaScript factory has run out of sugar! We have no more asyncs and we've fresh out of all awaits to give to users, so you'll have to re-implement it with a sugar alternative. Let's call it something legally distinct like `asynk` so that we don't get sued by Big Sugar.

Your task is to build a function called `asynk` that takes a generator factory that `yield`s promises wherever there would have been an `await` before. An example of how this would look is below.

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

Remember, we want this to behave as similarly to async/await as is feasible, there will be some basic requirements!

It should:
  - Return a promise
  - Automatically wrap returned non-Promises in a resolved Promise
  - Correctly yield a promise
  - Handle rejections as errors
  - Support try/catch in the generator function
  - Throw an error if trying to yield a non-promise
  
Good luck!