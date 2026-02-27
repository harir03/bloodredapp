# Tier 2 Features Implementation Plan

## 5. Offline Support / Data Caching
- [ ] Initialize Firebase offline persistence for Firestore.
- [ ] Utilize AsyncStorage to locally cache critical read-only tables (like user profile and basic lists) to ensure the UI doesn't crash without internet.

## 6. Data Export / Reporting (CSV Export)
- [ ] Implement a utility in `src/utils/exportUtils.ts` to convert JSON arrays to CSV strings.
- [ ] Incorporate `expo-file-system` and `expo-sharing` to generate a CSV file and open the native share sheet.
- [ ] Add "Export to CSV" buttons on `ManageDonorsScreen`, `ManageVolunteersScreen`, and `LeaderboardScreen`.

## 7. Data Privacy & Secure Handling Rules
- [ ] Setup strict `firestore.rules` preventing unauthorized bulk downloads.
- [ ] Add role-based field restrictions (only Admin/Helpline can query `donors`).

## 8. Lead Tracking from Awareness Sessions
- [ ] Update `Camp` / `BloodEvent` schema to include `leadsCollected` tracking.
- [ ] Create a `Lead` interface capturing prospective donors before they fully register.
- [ ] In the Event Details screen, add a section to Add/View leads.

---
Review process follows `instructions.md` Confidence Scoring.
