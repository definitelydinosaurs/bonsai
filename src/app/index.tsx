import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'

import useConfig from '~/hook/useConfig'
import { extractBook } from '~/util/data'
import { addBook, deleteBook, getBook, initializeData } from '~/query/book'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'

import Book from '~/component/Book'

export default function Screen() {
  const { baseUrl } = useConfig()
  const [isbn, setIsbn] = useState('')

  const { data: state = { sources: {} }, refetch: refetchState } = useQuery(initializeData)
  const { data = {}, isLoading, isSuccess, error, refetch: refetchBook } = useQuery(getBook(baseUrl, isbn))
  const mutation = useMutation(addBook(refetchState))
  const deleteMutation = useMutation(deleteBook(refetchState))

  const artifact = data[Object.keys(data)[0]]
  const book = extractBook({ ...(artifact || {}), isbn, cover: artifact?.cover?.large || '' })

  return (
    <View className='flex-1 justify-start items-center gap-5 p-6'>
      <Input
        className='w-full'
        value={isbn}
        onChangeText={setIsbn}
        placeholder='Enter ISBN here...'
        onSubmitEditing={() => isbn.length === 13 || isbn.length === 10 ? refetchBook() : ''}
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
      <ScrollView className='flex-1 w-full' showsVerticalScrollIndicator={false}>
        { Object.keys(state.sources).map(source =>
          <View key={source} className='w-full justify-center items-center mb-4'>
            <Book key={source} {...state.sources[source]} />
            <Button variant='outline' className='w-[20%] mt-4' onPress={() => deleteMutation.mutate(source)}>
              <Text>Delete</Text>
            </Button>
          </View>
        ) }
      </ScrollView>
    </View>
  )
}
