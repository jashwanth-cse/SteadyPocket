# SteadyPocket Mobile App (Frontend)

This is the front-end application built with **React Native (Expo)**. It provides a seamless, Google AMOLED-style dark mode UX for gig delivery workers to claim parametric insurance.

## 🚀 Tech Stack

- **Framework:** React Native / Expo
- **Language:** TypeScript
- **Navigation:** React Navigation (`expo-router` / `@react-navigation/native`)
- **UI Components:** `react-native-paper`, `expo-vector-icons`
- **Animations:** `react-native-reanimated`

## 📦 Installation & Setup

1. **Install Dependencies**

   Navigate to the app directory and install the required npm packages.
   ```bash
   cd steady_pocket_app
   npm install
   ```

2. **Set Environment Variables**

   Ensure you have configured your environment variables (Firebase config, API URL). You can copy `.env.example` to `.env`.
   ```bash
   cp .env.example .env
   ```

3. **Start the Development Server**

   Run the Expo CLI to start the Metro bundler.
   ```bash
   npm start
   # or
   npx expo start --clear
   ```

4. **Run on Device / Emulator**
   - Press **`a`** to run on an Android Emulator.
   - Press **`i`** to run on an iOS Simulator.
   - Press **`w`** to run on an web.
   - Scan the QR code using the **Expo Go** app on your physical device.

## 📁 Project Structure

- `app/` - Expo Router screens and global theme variables
- `src/components/` - Highly reusable AMOLED UI and layout components
- `src/screens/` - Native stack navigation screens
- `src/theme/` - Global AMOley styling tokens (colors, typography, motion)
- `services/` - Firebase authentication and API service integrations
