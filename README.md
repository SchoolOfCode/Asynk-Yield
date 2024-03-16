### Asynk/Yield

You may have heard that `async/await` is just syntatic sugar in JS. Well, I'm sorry to have to report this, but the JavaScript factory has run out of sugar! We have no more asyncs and we're fresh out of all awaits to give to users, so you'll have to re-implement it with a sugar alternative. Let's call it something legally distinct like `asynk` so that we don't get sued by Big Sugar.

Your task is to build a function called `asynk` that takes a generator factory that `yield`s promises wherever there would have been an `await` before. An example of how this would look is below.

```javascript
const id = 5;
const offsetID = asynk(function* () {
  const num = yield getID(id); // getID :: number => Promise<number>
  return num + 10;
})
// offsetID :: Promise<number>

```

Or a more real world example might be:

```javascript
// User :: { name: string, age: number, experience: number, colleagues: number[] }

const sumOfExperience = (id) => asynk(function* () {
  const user = yield getUserById(id);
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

Remember, we're emulating async/await with **generators** (albeit not perfectly - there is a difference as mentioned below), so there will be some basic requirements!

It should:
  - Take a generator function as its argument
  - Return a promise
  - Automatically wrap returned non-Promises in a resolved Promise
  - Correctly yield a promise
  - Catch errors and turn them into rejections
    - Make sure errors in the body of the generator aren't throw in place
  - Should return a rejection right away, without continuing
  - Support try/catch in the generator function
  - Throw an error if trying to yield a non-promise (unlike async/await, where one can await anything)
  
Good luck!