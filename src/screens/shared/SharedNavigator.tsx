
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserDetailsScreen from './UserDetailsScreen';
import AddUserScreen from './AddUserScreen';
import VolunteerDetailsScreen from './VolunteerDetailsScreen';
import AddVolunteerScreen from './AddVolunteerScreen';
import StaffDetailsScreen from './StaffDetailsScreen';
import AddStaffScreen from './AddStaffScreen';
import CallDetailsScreen from './CallDetailsScreen';
import AddCallScreen from './AddCallScreen';
import TaskDetailsScreen from './TaskDetailsScreen';

const Stack = createStackNavigator();

const SharedNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
      <Stack.Screen name="AddUser" component={AddUserScreen} />
      <Stack.Screen name="VolunteerDetails" component={VolunteerDetailsScreen} />
      <Stack.Screen name="AddVolunteer" component={AddVolunteerScreen} />
      <Stack.Screen name="StaffDetails" component={StaffDetailsScreen} />
      <Stack.Screen name="AddStaff" component={AddStaffScreen} />
      <Stack.Screen name="CallDetails" component={CallDetailsScreen} />
      <Stack.Screen name="AddCall" component={AddCallScreen} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
    </Stack.Navigator>
  );
};

export default SharedNavigator;
