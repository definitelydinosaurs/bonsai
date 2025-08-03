const CreateBook = props => {
  const [title, setTitle] = useState('')
  return (
    <View className='w-1/2'>
      <Input
        value={title}
        onChangeText={setTitle}
        placeholder='Enter title here...'
      />
    </View>
  )
}

export default CreateBook
