# SBEats Documentation
## User Experience Considerations
1. Finding a restaurant
Search Restaurant Tab -> Search in search bar/Click on a recommended restaurant 

2. Saving a restaurant
Search Restaurant Tab -> Search in search bar/Click on a recommended restaurant -> Save Spot -> Select category to save to

3. Rank a visit
Search Restaurant Tab -> Search restaurant in search bar -> Rank Visit -> Drag sliders and save ratings

4. Get Directions to a Restaurant
Search Restaurant Tab -> Search restaurant in search bar -> Get Directions

5. Plan a Restaurant Visitation
Calendar -> Select Date -> Click '+' -> Search Restaurant -> Select Time -> Save

6. View Saved Restaurants
Profile -> My Saved Spots

High-level Task/User Flow:
<img width="787" height="583" alt="Screenshot 2026-02-25 at 12 53 55 AM" src="https://github.com/user-attachments/assets/8fe22c36-80e1-4e6a-8868-ec6df59d1cec" />

## Team Decisions
1. Don't be afraid to communicate any questions or concerns. Speak up and ensure everyone is kept in the loop and there are no miscommunications within the team, such as during class meetings and increasing the number of messages in the team Slack channel.

2. Organize Kanban board such that it is clear which tickets should come before which. An organized Kanban board is easy to follow, and helps ensure everyone is assigned to a task and completes an issue each week.


## System Architecture
| Architecture | Technology/Framework |
| --- | --- |
| Frontend | **React Native** |
| Backend | **Firebase** |
| Database | **Firebase** |

Overview System Architecture Diagram
<img width="717" height="468" alt="Screenshot 2026-02-25 at 1 37 49 AM" src="https://github.com/user-attachments/assets/a79c5508-1df5-4a92-87b6-cfeed59b266b" />
* Frontend zone: Tab Screens, and Feature Screens, flowing down through Shared Components/Hooks, linked with backend.
* Firebase zone (backend): email/password

**More Details about Code Architecture are found in [ARCHITECTURE.md](https://github.com/ucsb-cs184-w26/team01-SBEats/blob/main/docs/ARCHITECTURE.md)**


# Design Process

## Sprint 01: Initial Design and Setup

During the first sprint, the primary focus was on setting up the foundational structure for the mobile app.

### Implementations

**Project Setup**

* Initialized the React Native project
* Configured Firebase for authentication and database
* Established the initial project structure for scalability

**Initial Restaurant List Page**

* Implemented a basic page that displays a list of restaurants
* Created the first version of the UI layout for browsing restaurant options

### Sprint Meeting Reference

See the Sprint 01 meeting notes ([class05](https://github.com/ucsb-cs184-w26/team01-SBEats/blob/main/team/sprint01/class05.md) and [class06](https://github.com/ucsb-cs184-w26/team01-SBEats/blob/main/team/sprint01/class06.md)) in the repository for more details.

### Design Screenshots

<img width="285" height="867" alt="Screenshot 2026-03-12 at 2 03 43 PM" src="https://github.com/user-attachments/assets/cc26415e-9dc7-4913-9f39-67108ac057f5" />

## Sprint 02 and Sprint 03: Feature Expansion

After the initial foundation, development focused on the main features and social aspect of the app.

### Key Feature Improvements

**Map Feature**

* Create the map interface to use as the main home page
* Allowed users to visually explore restaurant locations
* See their ratings on the map itself

**Discover Page**

* Added a discover page that recommends restaurants and users based on shared interests

### Design Screenshots

<img width="285" height="1266" alt="Screenshot 2026-03-12 at 1 30 17 PM" src="https://github.com/user-attachments/assets/18847959-84fa-46a3-b0ec-5991b340967d" />

<img width="320" height="691" alt="Screenshot 2026-03-16 at 3 49 32 PM" src="https://github.com/user-attachments/assets/d57f7cc6-dcd8-491e-9952-45a8792cf0be" />

# External Resources

### React Native + Expo Documentation

- https://reactnative.dev/docs/components-and-apis
- https://docs.expo.dev/versions/latest/sdk/third-party-overview/

Used for guidance on component development, navigation, and best practices when building the mobile application. This includes Expo Router as well as third-party libraries like *async-storage* and *datetimepicker*.

### Firebase Documentation

- https://firebase.google.com/docs/build

Used to configure authentication services and Firestore database.

### EAS Hosting Guide

- https://docs.expo.dev/eas/hosting/introduction/
- https://docs.expo.dev/eas-update/introduction/

Used to figure out how to deploy our mobile app.

# Difficulties Encountered

## Kanban Board Organization

One of the early difficulties involved organizing the team workflow within the Kanban board. Initially, team members had different expectations for how issues and tasks should be structured.

### Solution

The team held a meeting to get on the same page for issue organization. After agreeing on how everything was going to be structured, the board became significantly easier to manage and helped the team coordinate more effectively.

## Merge Conflicts

Merge conflicts were another challenge during development, particularly as multiple team members began contributing code simultaneously.

### Solution

At the beginning of the project, resolving merge conflicts was time consuming and occasionally confusing. However, as the quarter progressed, the team became more comfortable with Git workflows and conflict resolution.

Practices that helped reduce conflicts included:

* Frequently pulling the latest changes from the main branch
* Communicating with teammates before making overlapping changes
