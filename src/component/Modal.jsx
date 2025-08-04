import { Modal as RNModal, Pressable } from 'react-native'

const Modal = props => (
  <RNModal
    visible={props.isVisible}
    transparent
    animationType='fade'
    onRequestClose={props.onClose}
  >
    <Pressable
      className={`flex-1 bg-${props.isDarkColorScheme ? 'white' : 'black'}/50 justify-center items-center p-4`}
      // className='flex-1 bg-white/50 justify-center items-center p-4'
      onPress={props.onClose}
    >
      <Pressable
        className='bg-background rounded-lg p-6 max-w-lg w-full'
        onPress={e => e.stopPropagation()}
      >
        { props.children }
      </Pressable>
    </Pressable>
  </RNModal>
)

export default Modal
