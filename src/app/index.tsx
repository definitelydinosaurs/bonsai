import { useState } from 'react'
import { View, Image } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

import request from '~/util/request'
import { extractBook } from '~/util/data'
import { useConfig } from '~/hook/useConfig'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'

import Book from '~/component/Book'

export default function Screen() {
  const { baseUrl } = useConfig()
  const [isbn, setIsbn] = useState('')

  const { data = {}, isLoading, isSuccess, error, refetch } = useQuery({
    queryKey: ['book'],
    queryFn: () => request.get(`${baseUrl}/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`),
    enabled: false
  })

  const { data: state = { sources: {} } } = useQuery({
    queryKey: ['state'],
    queryFn: () => invoke('dispatch', { event: 'initialize_data' }).then(JSON.parse)
  })

  const book = extractBook({ ...(data[Object.keys(data)[0]] || {}), isbn })

  return (
    <View className='flex-1 justify-start items-center gap-5 p-6'>
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
      { isSuccess &&
        <>
          <Book {...book} />
          <Button variant='outline' className='w-[20%] mt-4' onPress={() => { invoke('dispatch', { event: 'add_source', payload: JSON.stringify(book) }) }}>
            <Text>Add</Text>
          </Button>
        </>
      }
      { Object.keys(state.sources).map(source => (<Book key={source} {...state.sources[source]} />)) }
    </View>
  )
}
