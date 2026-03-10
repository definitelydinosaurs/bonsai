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
  const [edges, setEdges] = useState<Record<string, Record<string, unknown>>>(
    {},
  );
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => {
    dispatch("app_started", {})
      .then((data) => {
        setNodes(data?.node);
        setEdges(data?.edge);
      })
      .catch(console.error);
  }, []);

  console.log({ nodes, edges });

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
              ...(Object.values(edges).filter(
                (edge) => edge.source === activeSource,
              ).length > 0
                ? {
                    next: Object.values(edges)
                      .filter((edge) => edge.source === activeSource)
                      .map((edge) => nodes[(edge.target as string) ?? ""].slug),
                  }
                : {}),
            }}
          />
        )}
        <BaseForm
          schema={{
            title: activeSource ? "Edit Source" : "Create Source",
            properties: {
              slug: {
                type: "string",
                title: "Slug",
                value: (nodes && (nodes[activeSource ?? ""]?.slug as string)) ?? "",
              },
              targets: {
                type: "search",
                title: "Targets",
                options: Object.entries(nodes ?? {}).map(([id, node]) => ({
                  label: node.slug as string,
                  value: id,
                })),
                value: "",
                values: "multiple",
                visible: activeSource !== null,
              },
            },
          }}
          onSubmit={
            activeSource
              ? ({ slug, targets }) =>
                  Promise.all([
                    dispatch("source_updated", { id: activeSource, slug })
                      .then((data) => setNodes(data?.node))
                      .then(() => setSheetOpen(false)),
                    ...(targets as unknown[]).map((target) =>
                      dispatch("edge_created", {
                        source: activeSource,
                        target,
                      }).then((data) => setEdges(data?.edge)),
                    ),
                  ])
              : ({ slug, targets }) =>
                  dispatch("node_created", { slug })
                    .then((data) => setNodes(data?.node))
                    .then(() => setSheetOpen(false))
          }
        />
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
