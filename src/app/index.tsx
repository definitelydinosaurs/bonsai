import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import isISBN from 'validator/lib/isISBN'

import useConfig from '~/hook/useConfig'
import { useColorScheme } from '~/lib/useColorScheme'
import { extractBook } from '~/util/data'
import { addBook, deleteBook, getBook, initializeData } from '~/query/book'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'

import Book from '~/component/Book'
import Modal from '~/component/Modal'

const handleSearch = ({ refetchBook, setShowModal, text }) => {
  if (isISBN(text)) {
    refetchBook()
    setShowModal(true)
  }
}

export default function Screen() {
  const { baseUrl } = useConfig()
  const { isDarkColorScheme } = useColorScheme()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { data: state = { sources: {} }, refetch: refetchState } = useQuery(initializeData)
  const { data = {}, isLoading, isSuccess, error, refetch: refetchBook } = useQuery(getBook(baseUrl, text))
  const mutation = useMutation(addBook({ setText, refetch: refetchState }))
  const deleteMutation = useMutation(deleteBook(refetchState))

  const artifact = data[Object.keys(data)[0]]
  const book = extractBook({ ...(artifact || {}), isbn: text, cover: artifact?.cover?.large || '' })

  useEffect(() => {
    if (mutation.isSuccess) {
      const timer = setTimeout(() => {
        mutation.reset()
        queryClient.removeQueries({ queryKey: ['book'] })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [mutation.isSuccess])

  return (
    <View className='flex-1 justify-start items-center gap-5 p-6'>
      <Button variant='outline' onPress={() => setShowModal(true)}>
        <Text>Search</Text>
      </Button>

      <Modal
        {...{ book, error, isDarkColorScheme, isLoading, isSuccess, setText, text }}
        isAdded={mutation.isSuccess}
        isVisible={showModal}
        isPending={mutation.isPending}
        onSearch={() => handleSearch({ text, refetchBook, setShowModal })}
        onClose={() => setShowModal(false)}
        onPress={() => {
          mutation.mutate(book)
          setText('')
        }}
      />

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
