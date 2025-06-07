export const extractBook = ({ isbn, title, authors, cover = '', description = '' }) => ({
  isbn,
  title,
  authors,
  cover,
  description
})
