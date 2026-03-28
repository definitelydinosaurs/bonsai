import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GestureResponderEvent } from "react-native";

import {
  BaseDetails,
  BaseForm,
  BaseList,
  BottomDrawer,
  Button,
  Image,
  Text,
  View,
  YStack,
} from "./component";

const sourcesURL = "https://openlibrary.org/api";

// eventually this should be split based on platform as well--this is only true for web
const dispatch = (event: string, payload: Record<string, unknown>) =>
  window.__TAURI_INTERNALS__
    ? invoke("dispatch", {
        event,
        payload: JSON.stringify(payload),
      }).then((rsp) => JSON.parse(rsp as string))
    : Promise.resolve({ node: {} });

const BookItem = ({ node }: { node: Record<string, unknown> }) => {
  console.log(node.cover || "https://i.imgur.com/of4baFL.png" as string);
  return (<YStack alignItems="center">
    <Image source={node.cover || "https://i.imgur.com/of4baFL.png" as string} height={150} width={100} />
    <Text>{node.title}</Text>
  </YStack>);
};

export default function Index() {
  const [sources, setSources] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Record<string, unknown>>();

  useEffect(() => {
    dispatch("app_started", {})
      .then((data) => {
        setSources(data?.sources);
      })
      .catch(console.error);
  }, []);

  console.log({ sources, searchResults });

  return (
    <View
      style={{
        flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
      }}
      pt="$8"
    >
      <BottomDrawer
        open={isSheetOpen}
        onOpenChange={(arg) => {
          setSheetOpen(arg);
          setActiveSource(null);
        }}
      >
        {!activeSource && (
          <BaseForm
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
            onSubmit={({ isbn }) =>
                    searchResults ? dispatch("source_added", { isbn, ...(searchResults ?? {}) })
                      .then((data) => setSources(data?.sources))
                      .then(() => setSheetOpen(false)) : Promise.resolve()
            }
            onChange={({ isbn }) =>
              fetch(
                `${sourcesURL}/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
              )
                .then((response) => response.json())
                .then(data => setSearchResults(data[`ISBN:${isbn}`]))
            }
          />
        )}
        {(searchResults || activeSource) && (
          <BaseDetails
            node={{
              ...(searchResults ? searchResults : sources && (sources[activeSource ?? ""] ?? {})),
            }}
          />
        )}
      </BottomDrawer>
      {(sources ?? {}) && (
        <BaseList
          ItemComponent={BookItem}
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
          targetKey="title"
          width="100%"
          alignItems="flex-start"
          gap="$3"
          padding="$3"
          alignContent="flex-start"
        />
      )}
      <Button
        // theme="blue"
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
