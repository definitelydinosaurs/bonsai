import { useState } from 'react'
import { View } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'

import { extractBook } from '~/util/data'
import { useConfig } from '~/hook/useConfig'
import { initializeData, getBook, addBook } from '~/query/book'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'

import Book from '~/component/Book'

export default function Screen() {
  const { baseUrl } = useConfig()
  const [isbn, setIsbn] = useState('')

  const { data: state = { sources: {} } } = useQuery(initializeData)
  const { data = {}, isLoading, isSuccess, error, refetch } = useQuery(getBook(baseUrl, isbn))
  const mutation = useMutation(addBook)

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
          <Button variant='outline' className='w-[20%] mt-4' onPress={() => mutation.mutate(book)}>
            <Text>{ mutation.isPending ? 'Adding...' : mutation.isSuccess ? 'Added' : 'Add' }</Text>
          </Button>
        </>
      }
      { Object.keys(state.sources).map(source => (<Book key={source} {...state.sources[source]} />)) }
    </View>
  )
}
