import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { TamaguiProvider, Theme } from "tamagui";

import { config } from "@tamagui/config";
import { createTamagui } from "tamagui";

const tamaguiConfig = createTamagui(config);

type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
      <Theme name="dark">
        <Stack screenOptions={{ headerShown: false }} />
      </Theme>
    </TamaguiProvider>
  );
}
