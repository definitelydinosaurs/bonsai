import { useState } from 'react'
import { View } from 'react-native'
import { useQuery } from '@tanstack/react-query'

import request from '~/util/request'
import { useConfig } from '~/hook/useConfig'

import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'


export default function Screen() {
  const { baseUrl, token } = useConfig()
  const [isbn, setIsbn] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['book'],
    queryFn: () => request.get(`${baseUrl}/book/${isbn}`, { Authorization: token }),
    enabled: false
  })

  return (
    <View className='flex-1 justify-start items-center gap-5 p-6 bg-secondary/30'>
      <Input
        className='w-full'
        value={isbn}
        onChangeText={setIsbn}
        placeholder="Enter ISBN here..."
        onSubmitEditing={() => isbn.length === 13 || isbn.length === 10 ? refetch() : ''}
        returnKeyType="search"
      />
      { isLoading && <Text>Loading...</Text> }
      { error && <Text className="text-red-500">{ error.message }</Text> }
      { data && (
        <View className="w-full">
          <Text className="text-lg font-bold">{ data.book.title }</Text>
          <Text>{ data.book.authors?.join(', ') }</Text>
        </View>
      ) }
    </View>
  )
}
