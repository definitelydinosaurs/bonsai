import { View, Image } from 'react-native'

import { Text } from '~/reusables/ui/text'

const Book = props => (
  <View className='w-full max-w-[500px] items-center'>
    <Image
      source={{ uri: props.cover.large || props.cover || 'https://i.imgur.com/of4baFL.png' }}
      className='w-[80%] max-w-[256px] aspect-[2/3] mb-4'
      resizeMode='contain'
    />
    <Text className='text-lg font-bold text-center'>{ props.title }</Text>
    { props.subtitle && <Text className='text-lg font-bold text-center'>{ props.subtitle }</Text> }
    <Text className='text-center'>{ props.authors?.map(author => author.name).join(', ') }</Text>
  </View>
)

export default Book
