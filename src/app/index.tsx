import { useState } from 'react'
import { View, Image } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

import request from '~/util/request'
import { useConfig } from '~/hook/useConfig'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'
import { extractBook } from '~/util/data'

export default function Screen() {
  const { baseUrl } = useConfig()
  const [isbn, setIsbn] = useState('')

  const { data = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['book'],
    queryFn: () => request.get(`${baseUrl}/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`),
    enabled: false
  })

  const book = extractBook(data[Object.keys(data)[0]] || {})

  return (
    <View className='flex-1 justify-start items-center gap-5 p-6 bg-secondary/30'>
      <Input
        className='w-full'
        value={isbn}
        onChangeText={setIsbn}
        placeholder='Enter ISBN here...'
        onSubmitEditing={() => isbn.length === 13 || isbn.length === 10 ? refetch() : ''}
        returnKeyType='search'
      />
      { isLoading && <Text>Loading...</Text> }
      { error && <Text className='text-red-500'>{ error.message }</Text> }
      { Object.keys(data).length > 0 && (
        <View className='flex-1 h-full w-full pt-[20%]'>
          <Image
            source={{ uri: book.cover ? book.cover.large : 'https://i.imgur.com/of4baFL.png' }}
            className='w-64 h-96 self-center mb-4'
            resizeMode='contain'
          />
          <Text className='text-lg font-bold text-center'>{ book.title }</Text>
          <Text className='text-center'>{ book.authors?.map(author => author.name).join(', ') }</Text>
        </View>
      ) }
      <Button variant='default' onPress={() => { invoke('dispatch', { event: 'add_source', payload: JSON.stringify(book) }) }}>
        <Text>Add</Text>
      </Button>
    </View>
  )
}
