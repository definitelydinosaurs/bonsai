import isISBN from 'validator/lib/isISBN'

export const handleSearch = ({ refetchBook, text }) => {
  if (isISBN(text)) { refetchBook() }
}

export const handleClose = ({ setBook, setShowDetails, setText }) => () => {
  setShowDetails(false)
  setText('')
  setBook({})
}

export const handlePress = ({ refetchBook, setShowDetails, setText }) => async id => {
  await setText(id)
  await refetchBook()
  await setShowDetails(true)
}
