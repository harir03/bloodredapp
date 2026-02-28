# BloodRed App - Lessons Learned

## 1. Production Readiness & TypeScript
- **Issue:** The `AddVolunteerScreen` was missing 5+ critical properties in the Firestore creation payload (`skills`, `joinedAt`, etc.), causing silent errors or rejections by security rules. 
- **Lesson:** Always cross-reference the `database.ts` types with form submission logic. Use strict Omit/Pick types to ensure all mandatory backend fields are present.
- **Action:** Implemented a full `tsc` check across the project to catch all implicit `any` and missing properties.

## 2. Platform Consistency (Expo/Native)
- **Issue:** Boilerplate components (like `modal.tsx` or `external-link.tsx`) often contain properties (`dismissTo`, invalid generically typed `Href`) that fail strict TS checks when using `expo-router` v3+.
- **Lesson:** Audit generated boilerplate for type compatibility when upgrading dependencies or moving to strict mode.
- **Action:** Fixed `dismissTo` error and corrected `Href` generic typing.

## 3. Persistent State & Authentication
- **Issue:** Authentication state loss on hot-reload or low-connectivity transitions.
- **Lesson:** Ensure `initializeAuth` is wrapped in try-catch for Expo environments and explicitly uses `AsyncStorage` persistence via `getReactNativePersistence`.
- **Action:** Fixed firebase config to handle double-initialization and platform-specific persistence.

## 4. UI/UX Consistency
- **Issue:** Some screens were missing `SafeAreaView` or robust keyboard handling.
- **Lesson:** Use `SafeAreaView` from `react-native-safe-area-context` for modern devices with notches.
- **Action:** (Planned) Audit all screens for `SafeAreaView` and notched device compatibility.
