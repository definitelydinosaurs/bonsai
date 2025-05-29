import { useMemo } from 'react'

import config from '../config.json'

export const useConfig = () => {
  const configuration = useMemo(() => config, [])
  return configuration
} 
