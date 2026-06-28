# Testing Strategy

## What was tested
- Unit tests:
  - `computeOverallRating`
  - `computeStudyRating`
  - `searchRestaurants`
- Component tests:
  - `LoginForm`
  - `DecimalRatingRow`

## Why these tests were selected
- These functions/components represent core product behavior:
  - rating aggregation (visible user-facing scores),
  - search/filter behavior (restaurant discovery),
  - login interaction and validation (auth entry point),
  - rating slider interaction (primary input mechanism).
- They also have deterministic logic and can be tested with minimal setup.

## Risks addressed
- Incorrect score calculations due to invalid values or rounding issues.
- Search regressions (case sensitivity, category matching, empty/no-match behavior).
- Login regressions where invalid forms still call Firebase or valid forms fail to submit.
- UI interaction regressions where slider values are not normalized before persistence.
