import { useState } from 'react'
import { ScrollView, View, Modal, Pressable } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'

import useConfig from '~/hook/useConfig'
import { useColorScheme } from '~/lib/useColorScheme'
import { extractBook } from '~/util/data'
import { addBook, deleteBook, getBook, initializeData } from '~/query/book'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'

import Book from '~/component/Book'

const handleSearch = ({ isbn, refetchBook, setShowModal }) => {
  if (isbn.length === 13 || isbn.length === 10) {
    refetchBook()
    setShowModal(true)
  }
}

export default function Screen() {
  const { baseUrl } = useConfig()
  const { isDarkColorScheme } = useColorScheme()
  const [isbn, setIsbn] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { data: state = { sources: {} }, refetch: refetchState } = useQuery(initializeData)
  const { data = {}, isLoading, isSuccess, error, refetch: refetchBook } = useQuery(getBook(baseUrl, isbn))
  const mutation = useMutation(addBook({ setIsbn, refetch: refetchState }))
  const deleteMutation = useMutation(deleteBook(refetchState))

  const artifact = data[Object.keys(data)[0]]
  const book = extractBook({ ...(artifact || {}), isbn, cover: artifact?.cover?.large || '' })

  return (
    <View className='flex-1 justify-start items-center gap-5 p-6'>
      <View className='w-1/2'>
        <Input
          value={isbn}
          onChangeText={setIsbn}
          placeholder='Enter ISBN here...'
          onSubmitEditing={() => handleSearch({ isbn, refetchBook, setShowModal })}
          returnKeyType='search'
        />
      </View>

      { isLoading && <Text>Loading...</Text> }
      { error && <Text className='text-red-500'>{ error.message }</Text> }

      <Modal
        visible={showModal && isSuccess && isbn.length > 0}
        transparent
        animationType='fade'
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          className={`flex-1 bg-${isDarkColorScheme ? 'white' : 'black'}/50 justify-center items-center p-4`}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            className='bg-background rounded-lg p-6 max-w-sm w-full'
            onPress={(e) => e.stopPropagation()}
          >
            <Book {...book} />
            <Button
              variant='outline'
              className='w-full mt-4'
              onPress={() => {

                mutation.mutate(book)
                setShowModal(false)
                setIsbn('')
              }}
            >
              <Text>{ mutation.isPending ? 'Adding...' : 'Add to Library' }</Text>
            </Button>
          </Pressable>
        </Pressable>
      </Modal>

      { mutation.isSuccess && <Text className='w-full text-center text-green-500'>Added</Text> }

      <ScrollView contentContainerClassName='w-full grid grid-cols-3 gap-4' showsVerticalScrollIndicator={false}>
        { Object.keys(state.sources).map(source =>
          <View key={source} className='justify-center items-center mb-4'>
            <Book key={source} {...state.sources[source]} />
            <Button variant='outline' className='w-full max-w-[256px] mt-4' onPress={() => deleteMutation.mutate(source)}>
              <Text>Delete</Text>
            </Button>
          </View>
        ) }
      </ScrollView>
    </View>
  )
}
