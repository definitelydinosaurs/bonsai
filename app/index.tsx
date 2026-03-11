import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GestureResponderEvent } from "react-native";

import {
  BaseDetails,
  BaseForm,
  BaseList,
  BottomDrawer,
  Button,
  View,
} from "./component";

// eventually this should be split based on platform as well--this is only true for web
const dispatch = (event: string, payload: Record<string, unknown>) =>
  window.__TAURI_INTERNALS__
    ? invoke("dispatch", {
        event,
        payload: JSON.stringify(payload),
      }).then((rsp) => JSON.parse(rsp as string))
    : Promise.resolve({ node: {} });

export default function Index() {
  const [nodes, setNodes] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => {
    dispatch("app_started", {})
      .then((data) => {
        setNodes(data?.node);
      })
      .catch(console.error);
  }, []);

  console.log({ nodes });

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BottomDrawer
        open={isSheetOpen}
        onOpenChange={(arg) => {
          setSheetOpen(arg);
          setActiveSource(null);
        }}
      >
        {activeSource && (
          <BaseDetails
            node={{
              ...(nodes && (nodes[activeSource ?? ""] ?? {})),
            }}
          />
        )}
        {!activeSource && (<BaseForm
          schema={{
            title: "Create Source",
            properties: {
              slug: {
                type: "string",
                title: "ISBN",
                value: (nodes && (nodes[activeSource ?? ""]?.slug as string)) ?? "",
              },
            },
          }}
          onSubmit={
            activeSource
              ? console.log
              : ({ slug, targets }) =>
                  dispatch("source_added", { slug })
                    .then((data) => setNodes(data?.node))
                    .then(() => setSheetOpen(false))
          }
        />)}
      </BottomDrawer>
      {(nodes ?? {}) && (
        <BaseList
          nodes={Object.entries(nodes ?? {}).map(([id, node]) => ({
            ...node,
            onPress: () => {
              setActiveSource(id);
              setSheetOpen(true);
            },
            actions: {
              delete: (e: GestureResponderEvent) => {
                e.stopPropagation();
                dispatch("node_deleted", { id }).then((data) =>
                  setNodes(data?.node),
                );
              },
            },
          }))}
          targetKey="slug"
          width="100%"
        />
      )}
      <Button
        theme="blue"
        onPress={() => setSheetOpen(true)}
        position="absolute"
        top="$3"
        right="$3"
        size="$2"
      >
        New Source
      </Button>
    </View>
  );
}
