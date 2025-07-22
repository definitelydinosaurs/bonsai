import { View } from 'react-native'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'

import Book from '~/component/Book'

const Search = props => (
  <>
    <View className='w-full'>
      <Input
        value={props.text}
        onChangeText={props.setText}
        placeholder='Enter ISBN here...'
        onSubmitEditing={props.onSearch}
        returnKeyType='search'
      />
    </View>
    { props.isLoading && <Text className='w-full mt-4 text-center'>Loading...</Text> }
    { props.error && <Text className='w-full mt-4 text-center text-red-500'>{ props.error.message }</Text> }
    { props.isAdded && <Text className='w-full mt-4 text-center text-green-500'>Added</Text> }

    { props.isSuccess && props.text.length > 0 &&
      <View className='w-full mt-4'>
        <Book {...props.book} />
        <Button
          variant='outline'
          className='w-full mt-4'
          onPress={props.onPress}
        >
          <Text>{ props.isPending ? 'Adding...' : 'Add to Library' }</Text>
        </Button>
      </View>
    }
  </>
)

export default Search
