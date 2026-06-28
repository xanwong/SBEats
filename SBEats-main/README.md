# SBEats

**SBEats is an all-in-one app to find, rate, rank, and share restaurants in the SB area.**

## Tech Stack
| Architecture | Technology/Framework |
| --- | --- |
| Frontend | **React Native** |
| Backend | **Firebase** |
| Database | **Firebase** |

## App Planning
When planning what SBEats should do for the user, the primary goal is to make discovering and sharing great food in the Santa Barbara area simple, engaging, and social. The app should help users easily find nearby restaurants, view relevant details, and make informed choices based on ratings and community feedback. By allowing users to rank and rate restaurants, SBEats empowers them to capture their personal food experiences, while the ability to share rankings with friends adds a social layer that encourages recommendations, discussion, and discovery.


## Group Members
- Brian Cheng *@brianc2730*
- Nathaniel MItter *@SexyJesusFreak*
- Alec Sekimoto *@alecsekimoto1*
- Karen Yuan *@karenlyuan*
- Jay Joo *@tizerk*
- Xandra Wong *@xanwong*
- Alex Jeong *@alexjh2*

## Installation

### Prerequisites
- **Git**
- **Node (v18 or above)** 
- **npm/npx**
- **Android Simulator**
- **iOS Simulator**
- **Expo Go App** (Physical Mobile App Testing)

### Dependencies

[**SBEats/package.json file**](https://github.com/ucsb-cs184-w26/team01-SBEats/blob/main/SBEats/package.json)

## Installation Steps

### 1. Clone the Repository

```
git clone https://github.com/ucsb-cs184-w26/team01-SBEats.git
cd SBEats
```

### 2. Install Dependencies

```
npm install
```

### 3. Set up .env file

a. Copy To Create Your Own .env File
```
cp .env.example .env
```

b. Set The Following Configuration Values for Your Specific Firebase Project Configuration

**Make sure Firestore and Firebase Auth are set up on your project as well**

```
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key-here

EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain-here

EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id-here

EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket-here

EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id-here

EXPO_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id-here
```

### 4. Start The App

**a. In the SBEats/ directory, run**
```
npx expo start
```

**Note: You may have to run nvm use stable to ensure proper version of Node**

**b. Click s to switch to Expo Go Build**


### 5. Run the App

**Expo Go on Mobile Device**

- Scan the QRCode that appears in the terminal

**iOS Simulator**

- Click i to open the iOS simulator

**Android Simulator**

- Click a to open the Android Simulator


## Deployment

**Scan the QR Code below to test out our prod deployment of our app!**

*Make sure to have the Expo Go app installed on your device*

![alt text](SBEats/Prod_Deployment.png)