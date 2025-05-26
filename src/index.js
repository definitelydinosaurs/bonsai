import { registerRootComponent } from 'expo'
import { ExpoRoot } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// https://docs.expo.dev/router/reference/troubleshooting/#expo_router_app_root-not-defined

const client = new QueryClient()

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app')
  return (
    <QueryClientProvider {...{ client }}>
      <ExpoRoot context={ctx} />
    </QueryClientProvider>
  )
}

registerRootComponent(App)
