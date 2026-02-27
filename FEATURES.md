# BloodConnect Ops - Feature Specification

BloodConnect is a comprehensive platform designed to streamline blood donation, organize volunteer efforts, and manage critical blood requests efficiently. Built with React Native (Expo) and powered by Firebase, the system offers a multi-tiered role architecture tailored for different operational needs within the blood donation lifecycle.

---

## 1. Authentication & Role Management

The platform employs a robust authentication system backed by Firebase Auth, coupled with dynamic role-based access control (RBAC).

*   **Secure Registration & Login:** Email/password-based authentication with form validation.
*   **Default Safe Role Assignment:** New registrants are systematically assigned the safe **Donor** role (`donor`) and placed in an inactive status to prevent unauthorized access to volunteer actions.
*   **Multi-Tiered Roles:**
    *   **Donor (Default):** Can view their own profile, track total impact (points/badges), and see upcoming public events. Features a dedicated `DonorDashboard`.
    *   **Volunteer:** Promoted from Donor by HR/Admin. Can view, accept, and complete specific blood requests or operational tasks. Access to `VolunteerDashboard`.
    *   **City Manager:** Oversees operations, tasks, and volunteers within a specific geographical jurisdiction.
    *   **Helpline Operator:** Handles incoming calls and initial logging of external blood requests.
    *   **HR Manager/Admin:** Full system access. Can modify any user's role (e.g., promote Donor to Volunteer), manage system-wide leaderboards, and oversee global operations.

## 2. Navigational Architecture

A dynamic routing system ensures users only see interfaces relevant to their permissions.

*   **Role-Based Navigators:** The application conditionally loads specific tab navigators upon successful login:
    *   `AdminNavigator`: Grants access to system-wide dashboards, User Management, and Task Management.
    *   `VolunteerNavigator`: Grants access to the Volunteer Dashboard, active Tasks, and Leaderboards.
    *   `DonorNavigator`: A restricted view featuring personal stats and a "Pending Volunteer Approval" status if awaiting promotion.
*   **Centralized AppStack:** Shared screens (e.g., Profile, Badges, Task Details) are abstracted into an overlapping stack, allowing seamless navigation from any role-specific tab.

## 3. Operations & Task Management

The core of BloodConnect Ops is its task tracking and fulfillment engine, utilized heavily by Volunteers and Admins.

*   **Real-time Synchronization:** Tasks are synchronized in real-time across all devices using Firestore `onSnapshot` listeners, ensuring volunteers aren't attempting to claim already-fulfilled requests.
*   **Task Lifecycle Management:** Requests transition through strictly enforced states: `pending` -> `in_progress` -> `completed` / `cancelled`.
*   **Volunteer Assignment:** Admins can manually assign tasks or blood requests to specific volunteers using the `AssignVolunteerScreen`.
*   **Global Sync Healing:** Built-in administrative tools can recursively sanitize incoming data and perform syncs to heal disjointed edge cases (e.g., resolving `undefined` data crashes).

## 4. Gamification & Leaderboards

To encourage community engagement and continuous volunteer effort, a point and badge system is seamlessly integrated.

*   **Dynamic Point System:** Volunteers and Donors earn points for specific actions (e.g., completing a task, attending a camp, fulfilling a blood request). 
*   **Automated Badge Unlocking:** Achieving point milestones automatically unlocks tiered badges (e.g., "New Recruit", "First Blood", "Hero", "Legend").
*   **City-Wide Leaderboards:** The `AllBadgesScreen` and Leaderboard tab track the top 50 volunteers within specific cities, fostering healthy competition.
*   **Cross-Collection Synchronization:** A dedicated mechanism synchronizes points and badges between the `volunteers` collection and the `profiles` collection to ensure instantaneous UI updates on the Profile screen.

## 5. Achievement Sharing

Users can proudly broadcast their impact metrics to external platforms.

*   **Global Impact Sharing:** From the `ProfileScreen`, users can invoke the native `Share` API to post their overall points, total tasks completed, and total badges earned to social media (Twitter, LinkedIn, WhatsApp).
*   **Collection Sharing:** Users can share their entire unlocked badge collection status from the `AllBadgesScreen`.
*   **Individual Badge Triumphs:** Each specific badge can be shared with a custom message highlighting the exact achievement (e.g., "I just earned the First Blood badge!").

## 6. Administrative Tools (Admin/HR)

A powerful suite of screens dedicated to overseeing the platform's health and user base.

*   **User Management (`ManageUsersScreen`):** Full list view of all registered profiles with searching and role-based filtering.
*   **Deep User Inspection (`UserDetailsScreen`):** 
    *   View contact info, joined date, and active tasks.
    *   Toggle account active/inactive status.
    *   **Promote to Volunteer:** One-click elevation of a user from Donor to Volunteer, which automatically provisions them a corresponding active record in the `volunteers` database collection.
*   **Task Oversight (`ManageTasksScreen`):** A god-view of all system tasks, allowing manual overrides, status changes, and reassignment.
*   **Staff Addition (`AddUserScreen` / `AddStaffScreen`):** Internal tools to manually provision new accounts with pre-defined roles instantly.

## 7. UI/UX & Theming

*   **Consistent Design System:** Built on a unified `theme.js/ts` file providing consistent typography (`FONTS`), spacing (`SPACING`), and a cohesive, high-contrast dark-mode inspired palette (`COLORS.background`, `COLORS.surface`, `COLORS.primary` red).
*   **Reusable Components:** Extensively utilizes modular components like `AppButton`, `AppInput`, `StatCard`, and `BadgeItem` to enforce visual consistency across highly diverse screens.
*   **Visual Feedback:** Comprehensive use of `ToastProvider` for non-intrusive success/error alerts, and loading spinners (`ActivityIndicator`) during asynchronous database calls.

## 8. Database Architecture (Firestore)

The data model prioritizes fast, denormalized reads over normalized complexity.
*   **`profiles`**: The source of truth for Authentication, Role (`donor`, `admin`, etc.), and Global Profile Data.
*   **`volunteers`**: Exists only for users with elevated impact roles. Tracks granular operational stats (tasks done, attendance log).
*   **`tasks` & `bloodRequests`**: Separated operational collections for tracking needs.
*   **`leaderboard`**: Aggregated city-level data, recalculated periodically or on point-gain to save expensive query reads across the entire volunteer base.
