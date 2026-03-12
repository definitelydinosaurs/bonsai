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
  const [sources, setSources] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => {
    dispatch("app_started", {})
      .then((data) => {
        setSources(data?.sources);
      })
      .catch(console.error);
  }, []);

  console.log({ sources });

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
              ...(sources && (sources[activeSource ?? ""] ?? {})),
            }}
          />
        )}
        {!activeSource && (<BaseForm
          schema={{
            title: "Create Source",
            properties: {
              isbn: {
                type: "string",
                title: "ISBN",
                value: "",
              },
            },
          }}
          onSubmit={
            activeSource
              ? console.log
              : ({ slug, targets }) =>
                  dispatch("source_added", { slug })
                    .then((data) => setSources(data?.sources))
                    .then(() => setSheetOpen(false))
          }
        />)}
      </BottomDrawer>
      {(sources ?? {}) && (
        <BaseList
          nodes={Object.entries(sources ?? {}).map(([id, node]) => ({
            ...node,
            onPress: () => {
              setActiveSource(id);
              setSheetOpen(true);
            },
            actions: {
              delete: (e: GestureResponderEvent) => {
                e.stopPropagation();
                dispatch("source_deleted", { id }).then((data) =>
                  setSources(data?.sources),
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
