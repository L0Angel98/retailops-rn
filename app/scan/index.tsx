import { Fragment, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";

import { createOrderOfflineFirst } from "../../src/features/orders/repository";
import { processSyncQueue } from "../../src/features/orders/sync";
import { useBeep } from "../../src/lib/beep";
import { useIsFocused } from "@react-navigation/native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const qc = useQueryClient();

  const lockRef = useRef(false);
  const lastRef = useRef<{ value: string; at: number } | null>(null);
  const { beep } = useBeep();

  const [open, setOpen] = useState(false);
  const [data, setData] = useState("");

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission]);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      setOpen(false);
      lockRef.current = false;
    }
  }, [isFocused]);

  async function handleScanned(raw: string) {
    if (open) return;
    if (lockRef.current) return;

    const now = Date.now();
    if (
      lastRef.current &&
      lastRef.current.value === raw &&
      now - lastRef.current.at < 2000
    ) {
      return;
    }

    lockRef.current = true;
    lastRef.current = { value: raw, at: now };

    beep();

    setData(raw);
    setOpen(true);
  }

  async function confirmSave() {
    await createOrderOfflineFirst({ code: `BAR-${data}` });
    await qc.invalidateQueries({ queryKey: ["orders"] });

    await processSyncQueue();
    await qc.invalidateQueries({ queryKey: ["orders"] });

    setOpen(false);
    setTimeout(() => {
      lockRef.current = false;
    }, 800);
  }

  function cancel() {
    setOpen(false);
    setTimeout(() => {
      lockRef.current = false;
    }, 800);
  }

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Text variant="titleLarge">Escanear</Text>
        <Button mode="contained" onPress={requestPermission}>
          Dar permiso
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {isFocused ? (
        <Fragment>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{
              barcodeTypes: [
                "ean13",
                "ean8",
                "code128",
                "code39",
                "upc_a",
                "upc_e",
                "qr",
              ],
            }}
            onBarcodeScanned={open ? undefined : (e) => handleScanned(e.data)}
          />
          <View
            style={{
              position: "absolute",
              top: 80,
              alignSelf: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              Apunta al código de barras
            </Text>
          </View>
          <View
            style={{
              position: "absolute",
              top: "35%",
              left: "10%",
              right: "10%",
              height: 120,
              borderWidth: 2,
              borderColor: "white",
              borderRadius: 12,
            }}
          />
        </Fragment>
      ) : (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>Pausado</Text>
        </View>
      )}

      <Portal>
        <Dialog visible={open} onDismiss={cancel}>
          <Dialog.Title>Confirmar</Dialog.Title>
          <Dialog.Content>
            <Text>¿Guardar este código como orden?</Text>
            <Text style={{ marginTop: 8, fontWeight: "700" }}>{data}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancel}>Cancelar</Button>
            <Button onPress={confirmSave}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
