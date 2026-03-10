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
  const [activeNode, setActiveNode] = useState<string | null>(null);
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
          setActiveNode(null);
        }}
      >
        {activeSource && (
          <BaseDetails
            node={{
              ...(nodes && (nodes[activeNode ?? ""] ?? {})),
              ...(Object.values(edges).filter(
                (edge) => edge.source === activeNode,
              ).length > 0
                ? {
                    next: Object.values(edges)
                      .filter((edge) => edge.source === activeNode)
                      .map((edge) => nodes[(edge.target as string) ?? ""].slug),
                  }
                : {}),
            }}
          />
        )}
        <BaseForm
          schema={{
            title: activeNode ? "Edit Node" : "Create Node",
            properties: {
              slug: {
                type: "string",
                title: "Slug",
                value: (nodes && (nodes[activeNode ?? ""]?.slug as string)) ?? "",
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
                visible: activeNode !== null,
              },
            },
          }}
          onSubmit={
            activeNode
              ? ({ slug, targets }) =>
                  Promise.all([
                    dispatch("node_updated", { id: activeNode, slug })
                      .then((data) => setNodes(data?.node))
                      .then(() => setSheetOpen(false)),
                    ...(targets as unknown[]).map((target) =>
                      dispatch("edge_created", {
                        source: activeNode,
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
              setActiveNode(id);
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
