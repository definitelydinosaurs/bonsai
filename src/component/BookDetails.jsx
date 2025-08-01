import { Image, View } from 'react-native'

import { Text } from '~/reusables/ui/text'

const BookDetails = props => (
  <View className='flex-1 w-full items-center'>
    <Image
      className='w-full max-w-[65%] min-w-[65%] aspect-[2/3] mb-4'
      source={{ uri: props.cover.length > 0 ? props.cover : 'https://i.imgur.com/of4baFL.png' }}
    />
    <Text className='text-lg font-bold text-center'>{ props.title }</Text>
    { props.subtitle && <Text className='text-lg font-bold text-center'>{ props.subtitle }</Text> }
    <Text className='text-lg font-bold text-center'>{ props.authors.join(', ') }</Text>
  </View>
)

export default BookDetails
