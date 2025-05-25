import * as React from 'react'
import { View } from 'react-native'

import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'

export default function Screen() {
  const [isbn, setIsbn] = React.useState('')

  return (
    <View className='flex-1 justify-start items-center gap-5 p-6 bg-secondary/30'>
      <Input
        className='w-full'
        value={isbn}
        onChangeText={setIsbn}
        placeholder="Enter ISBN here..."
      />
    </View>
  )
}
