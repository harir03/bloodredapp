import { FontAwesome5 } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { TouchableOpacity } from "react-native";
import TabBar from "../../components/ui/TabBar";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../stores/AuthProvider";
import AdminDashboardScreen from "./AdminDashboardScreen";
import ManageTasksScreen from "./ManageTasksScreen";
import ManageUsersScreen from "./ManageUsersScreen";

const Tab = createBottomTabNavigator();

const AdminNavigator = () => {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.text_primary,
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <FontAwesome5
              name="sign-out-alt"
              size={20}
              color={COLORS.text_muted}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="tachometer-alt" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={ManageUsersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={ManageTasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="tasks" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
