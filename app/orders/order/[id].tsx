import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Text, View } from "react-native";

import {
  deleteOrderOfflineFirst,
  getOrderById,
  updateOrderStatusOfflineFirst,
} from "../../../src/features/orders/repository";
import { processSyncQueue } from "../../../src/features/orders/sync";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { ActivityIndicator } from "react-native-paper";

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, disabled ? { opacity: 0.5 } : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
}


export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(String(id)),
  });

  async function deleteThis() {
    Alert.alert("Eliminar orden", "¿Seguro que quieres eliminarla?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteOrderOfflineFirst(order.id);
          await qc.invalidateQueries({ queryKey: ["orders"] });
          await syncNow();
          router.back();
        },
      },
    ]);
  }

  if (q.isLoading) return <Text style={{ padding: 16 }}>Cargando…</Text>;
  if (q.isError || !q.data?.order)
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={{ padding: 16 }}>No encontrada</Text>
      </SafeAreaView>
    );

  const { order } = q.data;

  const shownStatus = localStatus ?? order.status;


  async function syncNow() {
    const count = await processSyncQueue();
    if (count > 0) {
      await qc.invalidateQueries({ queryKey: ["orders"] });
      await qc.invalidateQueries({ queryKey: ["order", id] });
    }
  }

  async function setStatus(next: string) {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);

    const prevStatus = shownStatus;

    setLocalStatus(next);

    qc.setQueryData(["orders"], (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((o) =>
        o.id === order.id ? { ...o, status: next, synced: 0 } : o,
      );
    });

    qc.setQueryData(["order", id], (old: any) => {
      if (!old?.order) return old;
      return { ...old, order: { ...old.order, status: next, synced: 0 } };
    });

    try {
      await updateOrderStatusOfflineFirst(order.id, next);

      await qc.invalidateQueries({ queryKey: ["orders"] });
      await qc.invalidateQueries({ queryKey: ["order", id] });

      await syncNow();
    } catch (e) {
      setLocalStatus(prevStatus);

      qc.setQueryData(["orders"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) =>
          o.id === order.id ? { ...o, status: prevStatus } : o,
        );
      });

      qc.setQueryData(["order", id], (old: any) => {
        if (!old?.order) return old;
        return { ...old, order: { ...old.order, status: prevStatus } };
      });

      Alert.alert("Error", "No se pudo actualizar el estatus.");
    } finally {
      setIsUpdatingStatus(false);
      setLocalStatus(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={[styles.sectionTitle]}>Code: {order.code}</Text>

        <Text>Estatus: {shownStatus}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.sectionTitle}>Cambiar estatus</Text>
          {isUpdatingStatus ? <ActivityIndicator /> : null}
        </View>

        {isUpdatingStatus ? (
          <Text style={{ opacity: 0.7 }}>Actualizando…</Text>
        ) : null}

        <View style={styles.actionsGrid}>
          <ActionButton
            label="PENDING"
            onPress={() => setStatus("PENDING")}
            disabled={isUpdatingStatus}
          />
          <ActionButton
            label="PICKING"
            onPress={() => setStatus("PICKING")}
            disabled={isUpdatingStatus}
          />
          <ActionButton
            label="DELIVERED"
            onPress={() => setStatus("DELIVERED")}
            disabled={isUpdatingStatus}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
          Zona de riesgo
        </Text>

        <Pressable style={styles.dangerBtn} onPress={deleteThis}>
          <Text style={styles.dangerText}>Eliminar orden</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16, gap: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "800" },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  actionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: "48%",
    alignItems: "center",
  },
  actionBtnText: { fontWeight: "800" },

  dangerBtn: {
    borderWidth: 1,
    borderColor: "#b00020",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerText: { color: "#b00020", fontWeight: "800" },
});
