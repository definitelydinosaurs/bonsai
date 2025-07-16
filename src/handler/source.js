import isISBN from 'validator/lib/isISBN'

export const handleSearch = ({ refetchBook, text }) => {
  if (isISBN(text)) { refetchBook() }
}
