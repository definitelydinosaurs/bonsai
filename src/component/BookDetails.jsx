import { View } from 'react-native'

import { Text } from '~/reusables/ui/text'

const BookDetails = props => (
  <View className='flex-1 items-center'>
    <Text>{ props.title }</Text>
  </View>
)

export default BookDetails
