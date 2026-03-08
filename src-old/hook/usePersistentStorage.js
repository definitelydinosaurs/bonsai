import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const isWeb = Platform.OS === 'web'

const storage = {
  getItem: async key =>
    isWeb ? Promise.resolve(localStorage.getItem(key)) : AsyncStorage.getItem(key),
  setItem: async (key, value) =>
    isWeb ? Promise.resolve(localStorage.setItem(key, value)) : AsyncStorage.setItem(key, value)
}

export default (key, initialState) => {
  const [state, setState] = useState(initialState)
  useEffect(() => {
    storage.getItem(key).then(saved => {
      if (saved) { setState(JSON.parse(saved)) }
    })
  }, [key])
  useEffect(() => { storage.setItem(key, JSON.stringify(state)) }, [key, state])
  return [state, setState]
}
