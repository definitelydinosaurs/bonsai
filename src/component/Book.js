import { View, Image } from 'react-native'

import { Text } from '~/reusables/ui/text'

const Book = props => (
  <View className='flex-1 w-full items-center'>
    <Image
      source={{ uri: props.cover.length > 0 ? props.cover : 'https://i.imgur.com/of4baFL.png' }}
      className='w-[80%] max-w-[256px] aspect-[2/3] mb-4'
      resizeMode='contain'
    />
    <Text className='text-lg font-bold text-center'>{ props.title }</Text>
    { props.subtitle && <Text className='text-lg font-bold text-center'>{ props.subtitle }</Text> }
    <Text className='text-center'>{ props.authors?.join(', ') }</Text>
  </View>
)

export default Book
