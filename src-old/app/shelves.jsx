import { View } from 'react-native'
import { invoke } from '@tauri-apps/api/core'
import { useQuery } from '@tanstack/react-query'

import { Text } from '~/reusables/ui/text'

export default function Settings() {
  const { data = {} } = useQuery({
    queryKey: ['shelves'],
    queryFn: () => invoke('dispatch', { event: 'initialize_data' }).then(JSON.parse)
  })

  return (
    <View className='flex-1 p-4'>
      <Text className='text-2xl font-bold mb-4'>Shelves</Text>
      <ScrollView contentContainerClassName='w-full grid grid-cols-3 gap-4' showsVerticalScrollIndicator={false}>
        { Object.keys(data.shelves).map(shelf => (
          <View key={shelf} className='w-full justify-center items-center mb-4'>
            <Text>{ shelf }</Text>
          </View>
        )) }
      </ScrollView>
    </View>
  )
} 
