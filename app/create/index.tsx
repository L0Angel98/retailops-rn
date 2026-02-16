import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { createOrderOfflineFirst } from "../../src/features/orders/repository";
import { processSyncQueue } from "../../src/features/orders/sync";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateOrderScreen() {
  const [code, setCode] = useState("");
  const qc = useQueryClient();

  async function save() {
    const c = code.trim();
    if (!c) return;

    await createOrderOfflineFirst({ code: c });
    setCode("");

    await qc.invalidateQueries({ queryKey: ["orders"] });
    await processSyncQueue();
    await qc.invalidateQueries({ queryKey: ["orders"] });
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text variant="titleLarge">Nueva orden</Text>
        <TextInput
          label="Código (ej. ORD-2001)"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <Button mode="contained" onPress={save}>
          Guardar
        </Button>
      </View>
    </SafeAreaView>
  );
}
