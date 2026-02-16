import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listOrders,
  deleteOrdersOfflineFirst,
} from "../../src/features/orders/repository";
import { processSyncQueue } from "../../src/features/orders/sync";
import { useConnectivity } from "../../src/features/orders/useConnectivity";
import { useSyncing } from "../../src/features/orders/useSyncing";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-paper";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b",
  PICKING: "#2563eb",
  DELIVERED: "#16a34a",
};

function StatusChip({ status }: { status: string }) {
  return (
    <View
      style={{
        backgroundColor: STATUS_COLOR[status] ?? "#999",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
        {status}
      </Text>
    </View>
  );
}

export default function OrdersScreen() {
  const q = useQuery({ queryKey: ["orders"], queryFn: listOrders });
  const qc = useQueryClient();

  const { online } = useConnectivity();
  const syncing = useSyncing();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function enterSelectionWith(id: string) {
    setSelectionMode(true);
    setSelected((prev) => ({ ...prev, [id]: true }));
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelected({});
  }

  async function syncNow() {
    const count = await processSyncQueue();
    if (count > 0) await qc.invalidateQueries({ queryKey: ["orders"] });
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return;

    Alert.alert(
      "Eliminar órdenes",
      `¿Seguro que quieres eliminar ${selectedIds.length} orden(es)?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deleteOrdersOfflineFirst(selectedIds);

            await qc.invalidateQueries({ queryKey: ["orders"] });

            await syncNow();

            exitSelection();
          },
        },
      ],
    );
  }

  useFocusEffect(
    useCallback(() => {
      q.refetch();
    }, [q]),
  );

  if (q.isLoading)
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  if (q.isError) return <Text style={{ padding: 16 }}>Error al cargar</Text>;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
              }}
            >
              <Text>{online ? "🟢 Online" : "🔴 Offline"}</Text>
            </View>

            {syncing ? <Text>⏳ Sincronizando…</Text> : null}
          </View>

          {selectionMode ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button title="Cancelar" onPress={exitSelection} />
              <Button
                title={`Eliminar (${selectedIds.length})`}
                onPress={deleteSelected}
                disabled={selectedIds.length === 0}
                color="#b00020"
              />
            </View>
          ) : null}
        </View>

        {/* Título */}
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
          Órdenes
        </Text>

        {q.data?.length === 0 ? (
          <Text style={{ textAlign: "center", opacity: 0.6, marginTop: 40 }}>
            No hay órdenes aún.
            {"\n"}Crea una o escanea un código.
          </Text>
        ) : (
          <FlatList
            data={q.data}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => {
              const isSelected = !!selected[item.id];

              const Row = (
                <TouchableOpacity
                  onLongPress={() => enterSelectionWith(item.id)}
                  onPress={() => {
                    if (selectionMode) toggle(item.id);
                  }}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 10,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    opacity: selectionMode && !isSelected ? 0.85 : 1,
                  }}
                >
                  {selectionMode ? (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderWidth: 2,
                        borderRadius: 6,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected ? (
                        <Text style={{ fontWeight: "900" }}>✓</Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text
                        style={{ fontSize: 18, fontWeight: "800", flex: 1 }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.code}
                      </Text>

                      <View style={{ flexShrink: 0 }}>
                        <StatusChip status={item.status} />
                      </View>
                    </View>

                    <Text
                      style={{ marginTop: 6, opacity: 0.7 }}
                      numberOfLines={1}
                    >
                      {item.synced ? "✅ Sincronizado" : "🕒 Pendiente de sync"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );

              if (!selectionMode) {
                return (
                  <Link key={item.id} href={`/orders/order/${item.id}`} asChild>
                    {Row}
                  </Link>
                );
              }

              return <View key={item.id}>{Row}</View>;
            }}
          />
        )}

        {!selectionMode ? (
          <Button
            title="Sincronizar ahora"
            onPress={syncNow}
            disabled={!online || syncing}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
