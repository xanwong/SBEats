# HW04 Design Contribution

My HW04 contributions are covered in 2 branches
- `xw-update-color-scheme`
- `xw-update-rest-ps`

## Design Structure

### File Responsibilities
- `SBEats/constants/theme.ts`
  - Defines the color palettes
  - Defines `Colors.light` and `Colors.dark` values (text, background, tint, borders, semantic component colors)

- `SBEats/constants/design.ts`
  - Global design tokens for spacing, typography, radius, and elevation
  - Re-exports color palette for app via `AppColor`

- `SBEats/constants/calendar-theme.ts`
  - Semantic calendar mappings for react-native-calendars and custom calendar elements

- `SBEats/components/themed-view.tsx` and `SBEats/components/themed-text.tsx`
  - Theme-aware wrappers for consistent light/dark rendering by default

### To Use:
1. Resolve mode and theme once at top of the component
   - `const colorScheme = useColorScheme() ?? 'light'`
   - `const theme = AppColor[colorScheme]`

2. Use pre-specified token values for spacing, typography, and radius
   - Spacing: `Spacing.sm`, `Spacing.md`, `Spacing.lg`
   - Typography: `Typography.size.*`, `Typography.weight.*`
   - Radius: `Radius.*`

3. Use semantic color tokens from `theme` instead of raw hex
   - For example: `theme.background`, `theme.surface`, `theme.text`, `theme.mutedText`, `theme.border`, `theme.tint`

4. For calendar UI
   - Use `getCalendarTheme(theme, isDark)` for `react-native-calendars`
   - Use `getCalendarPalette(theme, isDark)` for custom calendar elements

5. Prefer themed wrappers for base text/view
  - Use `ThemedView` and `ThemedText` for default adaptive light/dark styling


## Changes Made

### 1) Navigation Bar
Organized pages in a more predictable way. Consolidated pages on navigation bar into 5 to avoid overwhelming users
- Displays Search Page under Discover Page through the search bar
- Display Leaderboard Page under Profile Page through the Leaderboard card

Initial:

<img width="200" height="auto" alt="IMG_1437 2" src="https://github.com/user-attachments/assets/b2184075-87fe-4499-ab6a-abcc047ba84c" />

Final:

<img width="200" height="auto" alt="IMG_1427" src="https://github.com/user-attachments/assets/c8c123aa-268d-4f3a-b78c-a982a1b4eee7" />
<img width="200" height="auto" alt="IMG_1428" src="https://github.com/user-attachments/assets/4d8d8ae2-ff7a-410a-b90c-07ab44ac642a" />
<img width="200" height="auto" alt="IMG_1423 2" src="https://github.com/user-attachments/assets/17836b50-5e44-4601-820e-bf23616fe57a" />


### 2) Color palette/Consistent Design
Initially, theme usage was hardcoded in multiple screens, causing inconsistencies in color, spacing, and contrast. There was also no main color chosen for branding. Thus, I introduced a centralized design approach through `constants/theme.ts` and `constants/design.ts`. The app now has a purple branding, using neutral shades of black and white to build the color palette. There is also a consistent header across the pages.

Initial:

<img width="200" height="auto" alt="IMG_1375" src="https://github.com/user-attachments/assets/1b173313-f36c-4deb-82c6-f48c48fcaaa5" />
<img width="200" height="auto" alt="IMG_1363" src="https://github.com/user-attachments/assets/ccefabbe-c67e-449d-85bf-ca319675a0d5" />

Final:

<img width="200" height="auto" alt="IMG_1423" src="https://github.com/user-attachments/assets/0924d3aa-87aa-408d-94ec-2745d000210f" />
<img width="200" height="auto" alt="IMG_1418" src="https://github.com/user-attachments/assets/ca4baf3a-27d0-4244-9066-832598b7084e" />


### 3) Dark Mode Calendar UI
I introduced a dark mode color palette to the Calendar page since it did not have one before. This ensures the light/dark consistency.

Initial vs Final:

<img width="200" height="auto" alt="IMG_1373" src="https://github.com/user-attachments/assets/e0aeb62d-ffb3-4324-b904-a65c76f727da" />
<img width="200" height="auto" alt="IMG_1424" src="https://github.com/user-attachments/assets/f6825ca1-bd3b-40dc-ba8b-cac5487e8284" />


### 4) Restaurant Page
Initially, the restaurant page had readability and hierarchy issues:
- Image overlays were hard to read in some cases
- Slightly disorganized information and action sections
Thus, I improved the restaurant page by:
- Add gradient overlay on hero image to improve legibility
- Sections reorganized as follows for a more intuitive experience:
    1) Ratings
    2) Primary actions
    3) Gallery
    4) Quick info
    6) Study Spot Offerings

Initial:

<img width="200" height="auto" alt="IMG_1368" src="https://github.com/user-attachments/assets/3fe86118-e45c-4fc3-a16b-bad7b1c48993" />
<img width="200" height="auto" alt="IMG_1370" src="https://github.com/user-attachments/assets/e9371a79-6d4a-4938-9908-b92697e59766" />

Final:

<img width="200" height="auto" alt="IMG_1442" src="https://github.com/user-attachments/assets/9a7470cb-ecff-4859-8f93-1fe55bb2e401" />
<img width="200" height="auto" alt="IMG_1443" src="https://github.com/user-attachments/assets/91012ca5-44f0-4d3b-bde3-13183af2a0ad" />


## Affected Folder URLs

### 1) Core Design System
- `SBEats/constants/`
  - https://github.com/ucsb-cs184-w26/team01-SBEats/tree/xw-update-color-scheme/SBEats/constants

### 2) Calendar UI Component
- `SBEats/components/`
  - https://github.com/ucsb-cs184-w26/team01-SBEats/tree/xw-update-color-scheme/SBEats/components

### 3) All Pages
- `SBEats/app/(tabs)/`
  - https://github.com/ucsb-cs184-w26/team01-SBEats/tree/xw-update-color-scheme/SBEats/app/%28tabs%29

### 4) Restaurant Page
- `SBEats/app/restaurant/`
  - https://github.com/ucsb-cs184-w26/team01-SBEats/tree/xw-update-rest-ps/SBEats/app/restaurant
