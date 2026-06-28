# Testing Files
* Unit Test: `SBEats/app/tests/Createpost.unit.test.tsx`
* Component Test: `SBEats/app/tests/Createpost.component.test.tsx`
* Integration Test: `SBEats/app/tests/Leaderboard.integration.test.tsx`
* A/B Test: `SBEats/app/tests/Visitedplacescard.ab.test.tsx`

# To Run Tests
From SBEats/ directory:
```
npx jest                          # run all 4 test files
npx jest createPost.unit          # just unit tests
npx jest leaderboard.integration  # just integration tests
npx jest createPost.component     # just component tests
npx jest visitedPlacesCard.ab     # just A/B tests
npx jest --coverage               # with coverage report
npx jest --watch                  # re-runs on save
```

Install dependencies: `npm install --save-dev jest-expo --legacy-peer-deps`
