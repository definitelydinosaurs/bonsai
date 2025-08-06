import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import useConfig from '~/hook/useConfig'
import { handleSearch } from '~/handler/source'
import { extractBook } from '~/util/data'
import { addBook, deleteBook, getBook, initializeData } from '~/query/source'

import { useColorScheme } from '~/lib/useColorScheme'
import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'

import Book from '~/component/Book'
import BookDetails from '~/component/BookDetails'
import Modal from '~/component/Modal'
import Search from '~/component/Search'

const handleClose = ({ setBook, setShowDetails }) => () => {
  setShowDetails(false)
  setBook({})
}

const handlePress = ({ refetchBook, setShowDetails, setText }) => async id => {
  await setText(id)
  await refetchBook()
  await setShowDetails(true)
}

export default function Screen() {
  const { baseUrl } = useConfig()
  const { isDarkColorScheme } = useColorScheme()
  const queryClient = useQueryClient()

  const [text, setText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [book, setBook] = useState({})

  const { data: state = { sources: {} }, refetch: refetchState } = useQuery(initializeData)
  const { data = {}, isLoading, isSuccess, error, refetch: refetchBook } = useQuery(getBook(baseUrl, text))
  const mutation = useMutation(addBook({ setText, refetch: refetchState }))
  const deleteMutation = useMutation(deleteBook(refetchState))

  useEffect(() => {
    const artifact = data[Object.keys(data)[0]]
    setBook(extractBook({ ...(artifact || {}), isbn: text, cover: artifact?.cover?.large || '' }))
  }, [data])

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
      <Button variant='outline' className='px-[10%]' onPress={() => setShowSearch(true)}>
        <Text>Search</Text>
      </Button>

      <Modal {...{ isDarkColorScheme }} isVisible={showSearch} onClose={() => setShowSearch(false)}>
        <Search
          {...{ book, error, isLoading, isSuccess, setText, text }}
          isAdded={mutation.isSuccess}
          isPending={mutation.isPending}
          onSearch={() => handleSearch({ text, refetchBook })}
          onPress={() => {
            mutation.mutate(book)
            setText('')
          }}
        />
      </Modal>

      <Modal {...{ isDarkColorScheme }} isVisible={showDetails} onClose={handleClose({ setBook, setShowDetails })}>
        { book && <BookDetails {...book} /> }
      </Modal>

      <ScrollView contentContainerClassName='w-full grid grid-cols-3 gap-4' showsVerticalScrollIndicator={false}>
        { Object.keys(state.sources).map(source =>
          <View key={source} className='w-full justify-center items-center mb-4'>
            <Book key={source} {...state.sources[source]} onPress={handlePress({ refetchBook, setShowDetails, setText })} />
            <Button variant='outline' className='w-full max-w-[256px] mt-4' onPress={() => deleteMutation.mutate(source)}>
              <Text>Delete</Text>
            </Button>
          </View>
        ) }
      </ScrollView>
    </View>
  )
}
