import isISBN from 'validator/lib/isISBN'

export const handleSearch = ({ refetchBook, setShowModal, text }) => {
  if (isISBN(text)) {
    refetchBook()
    setShowModal(true)
  }
}
