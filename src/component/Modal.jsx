import { Modal as RNModal, Pressable } from 'react-native'

import { Button } from '~/reusables/ui/button'
import { Text } from '~/reusables/ui/text'

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
        className='bg-background rounded-lg p-6 max-w-sm w-full'
        onPress={e => e.stopPropagation()}
      >
        <Book {...props.book} />
        <Button
          variant='outline'
          className='w-full mt-4'
          onPress={props.onPress}
        >
          <Text>{ props.isPending ? 'Adding...' : 'Add to Library' }</Text>
        </Button>
      </Pressable>
    </Pressable>
  </RNModal>
)

export default Modal
