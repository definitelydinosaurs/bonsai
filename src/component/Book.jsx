import { View, Image } from 'react-native'

import { Text } from '~/reusables/ui/text'

const Book = props => (
  <View className='flex-1 items-center'>
    <Image
      className='w-full max-w-[256px] aspect-[2/3] mb-4'
      source={{ uri: props.cover.length > 0 ? props.cover : 'https://i.imgur.com/of4baFL.png' }}
    />
    <Text className='text-lg font-bold text-center'>{ props.title }</Text>
    { props.subtitle && <Text className='text-lg font-bold text-center'>{ props.subtitle }</Text> }
    <Text className='text-center'>{ props.authors?.join(', ') }</Text>
  </View>
)

export default Book
