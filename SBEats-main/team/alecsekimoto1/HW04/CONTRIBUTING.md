# Contributing to SBEats

## Branch Strategy

**Never commit directly to `main`.** All work happens on feature branches.

### Branch Naming

Use the format: `<your-initials>-<short-description>`

Examples:
- `as-sharingrestaurants`
- `jd-mark-visited`
- `mk-leaderboard-ui`

---

## Creating a Feature Branch

Always branch off the latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b <your-initials>-<feature-name>
```

If you need to incorporate changes that a teammate merged while you were working:

```bash
git checkout your-branch
git pull origin main --no-rebase
```

---

## Commit Message Conventions

### Format

```
<short summary in present tense> (closes #<issue-number>)
```

### Examples

```bash
# Feature
git commit -m "add share button to restaurant profile (closes #12)"

# Bug fix
git commit -m "fix map pins not updating after rating (closes #18)"

# Merge conflict resolution
git commit -m "merge main: combine share button with mark visited feature"

# Documentation
git commit -m "add contributing guide and Firestore schema docs"
```

### Rules

- Keep the summary under 72 characters
- Reference the GitHub issue number with `closes #N` to auto-close the issue on merge

---

## Pull Request Workflow

### 1. Push Your Branch

```bash
git push origin your-branch-name
```

### 2. Open the PR on GitHub

### 3. Write the PR Description

Use this template:

```markdown
## Summary
One sentence explaining what this PR does.

## Changes
- List each file changed and what was modified
- Be specific (e.g., "Added `getMyRatings()` to `ratingService.ts`")

## Testing
- Describe how you tested (simulator, device, etc.)
- List specific test steps you performed

## Screenshots
(paste before/after screenshots if UI changed)

## Related Issues
Closes #<issue-number>
```

### 4. Request Review

Tag at least one teammate as a reviewer. Wait for approval before merging.

## Handling Merge Conflicts


### How to Resolve Locally

1. Pull main into your branch:

```bash
git checkout your-branch
git pull origin main --no-rebase
```

2. Git will tell you which files have conflicts. Open them and look for conflict markers:

```
<<<<<<< HEAD (your changes)
  <TouchableOpacity style={styles.button} onPress={handleShare}>
    <Ionicons name="share-outline" size={20} color="#fff" />
  </TouchableOpacity>
=======
  <TouchableOpacity style={styles.button} onPress={handleMarkVisitedPress}>
    <ThemedText style={styles.buttonText}>Mark Visited</ThemedText>
  </TouchableOpacity>
>>>>>>> main (their changes)
```

3. Edit the file to keep both changes (or whichever is correct). Remove all `<<<<<<<`, `=======`, and `>>>>>>>` markers.

4. Stage and commit:

```bash
git add <conflicted-file>
git commit -m "merge main: combine <your feature> with <their feature>"
git push origin your-branch
```

### Tips for Avoiding Conflicts

- **Pull main often** — run `git pull origin main --no-rebase` on your branch daily
- **Communicate** — if you know a teammate is working on the same file, coordinate in Slack
- **Keep PRs small** — smaller changes mean smaller conflicts
```bash
git pull origin main --no-rebase
```
