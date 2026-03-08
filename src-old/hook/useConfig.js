import { useMemo } from 'react'

import config from '../../config.json'

const useConfig = () => {
  const configuration = useMemo(() => config, [])
  return configuration
} 

export default useConfig
