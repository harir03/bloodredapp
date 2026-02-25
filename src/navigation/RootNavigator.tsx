import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, SPACING } from "../constants/theme";
import { useAuth } from "../stores/AuthProvider";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Role Navigators
import AdminNavigator from "../screens/admin/AdminNavigator";
import CityManagerNavigator from "../screens/city-manager/CityManagerNavigator";
import HelplineNavigator from "../screens/helpline/HelplineNavigator";
import HRManagerNavigator from "../screens/hr-manager/HRManagerNavigator";
import VolunteerNavigator from "../screens/volunteer/VolunteerNavigator";

// Shared Screens
import AddCallScreen from "../screens/shared/AddCallScreen";
import AddStaffScreen from "../screens/shared/AddStaffScreen";
import AddTaskScreen from "../screens/shared/AddTaskScreen";
import AddUserScreen from "../screens/shared/AddUserScreen";
import AddVolunteerScreen from "../screens/shared/AddVolunteerScreen";
import CallDetailsScreen from "../screens/shared/CallDetailsScreen";
import StaffDetailsScreen from "../screens/shared/StaffDetailsScreen";
import TaskDetailsScreen from "../screens/shared/TaskDetailsScreen";
import UserDetailsScreen from "../screens/shared/UserDetailsScreen";
import VolunteerDetailsScreen from "../screens/shared/VolunteerDetailsScreen";
// New shared screens
import AddBloodRequestScreen from "../screens/shared/AddBloodRequestScreen";
import AddEventScreen from "../screens/shared/AddEventScreen";
import AssignVolunteerScreen from "../screens/shared/AssignVolunteerScreen";
import BloodRequestDetailsScreen from "../screens/shared/BloodRequestDetailsScreen";
import EventsScreen from "../screens/shared/EventsScreen";
import LeaderboardScreen from "../screens/shared/LeaderboardScreen";
import ManageBloodRequestsScreen from "../screens/shared/ManageBloodRequestsScreen";
import ManageDonorsScreen from "../screens/shared/ManageDonorsScreen";
import NotificationsScreen from "../screens/shared/NotificationsScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";
import ReportsScreen from "../screens/shared/ReportsScreen";

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const getRoleNavigator = (role: string) => {
  switch (role) {
    case "admin":
      return AdminNavigator;
    case "city_manager":
      return CityManagerNavigator;
    case "helpline":
      return HelplineNavigator;
    case "hr_manager":
      return HRManagerNavigator;
    case "volunteer":
      return VolunteerNavigator;
    default:
      return AdminNavigator;
  }
};

const AppStack = () => {
  const { userRole } = useAuth();
  const RoleNavigator = getRoleNavigator(userRole || "admin");

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={RoleNavigator} />
      {/* Shared detail/add screens accessible from any role */}
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
      <Stack.Screen name="AddUser" component={AddUserScreen} />
      <Stack.Screen
        name="VolunteerDetails"
        component={VolunteerDetailsScreen}
      />
      <Stack.Screen name="AddVolunteer" component={AddVolunteerScreen} />
      <Stack.Screen name="StaffDetails" component={StaffDetailsScreen} />
      <Stack.Screen name="AddStaff" component={AddStaffScreen} />
      <Stack.Screen name="CallDetails" component={CallDetailsScreen} />
      <Stack.Screen name="AddCall" component={AddCallScreen} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} />
      {/* Blood Request screens */}
      <Stack.Screen
        name="ManageBloodRequests"
        component={ManageBloodRequestsScreen}
      />
      <Stack.Screen
        name="BloodRequestDetails"
        component={BloodRequestDetailsScreen}
      />
      <Stack.Screen name="AddBloodRequest" component={AddBloodRequestScreen} />
      <Stack.Screen name="AssignVolunteer" component={AssignVolunteerScreen} />
      <Stack.Screen name="ManageDonors" component={ManageDonorsScreen} />
      {/* Utility screens */}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <Text style={loadingStyles.logo}>🩸</Text>
        <Text style={loadingStyles.title}>BloodConnect Ops</Text>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={loadingStyles.spinner}
        />
      </View>
    );
  }

  return (
    <NavigationContainer
      independent={true}
      theme={{
        dark: true,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.surface,
          text: COLORS.text_primary,
          border: COLORS.border,
          notification: COLORS.primary,
        },
      }}
    >
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  logo: {
    fontSize: 64,
    marginBottom: SPACING.m,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.primary,
  },
  spinner: {
    marginTop: SPACING.xxl,
  },
});

export default RootNavigator;
