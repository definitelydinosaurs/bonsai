import { Modal as RNModal, Pressable, View } from 'react-native'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'
import { Input } from '~/reusables/ui/input'

import Book from '~/component/Book'

const Modal = props => (
  <RNModal
    visible={props.isVisible}
    transparent
    animationType='fade'
    onRequestClose={props.onClose}
  >
    <Pressable
      className={`flex-1 bg-${props.isDarkColorScheme ? 'white' : 'black'}/50 justify-center items-center p-4`}
      onPress={props.onClose}
    >
      <Pressable
        className='bg-background rounded-lg p-6 max-w-lg w-full'
        onPress={e => e.stopPropagation()}
      >
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
      </Pressable>
    </Pressable>
  </RNModal>
)

export default Modal
