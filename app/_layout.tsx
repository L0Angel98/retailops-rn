import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";

import { runMigrations } from "../src/db/migrations";
import { seedIfEmpty } from "../src/db/seed";
import { startAutoSync } from "../src/features/orders/sync";


const queryClient = new QueryClient();

import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, PaperProvider } from "react-native-paper";

function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarLabelPosition: "below-icon" }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: "Órdenes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create/index"
        options={{
          title: "Nueva",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan/index"
        options={{
          title: "Escanear",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barcode" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="orders/order/[id]" options={{ href: null }} />
    </Tabs>
  );
}

function AppShell() {
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = startAutoSync(() => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    });
    return () => unsub();
  }, [qc]);

  return <TabLayout />;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      runMigrations();
      seedIfEmpty().then(() => setReady(true));
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <AppShell />
      </PaperProvider>
    </QueryClientProvider>
  );
}
